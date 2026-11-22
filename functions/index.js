const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const { HttpsError, onCall } = require("firebase-functions/v2/https");

initializeApp();

const auth = getAuth();
const db = getFirestore();

async function requireAdmin(request) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in to manage users.");
  }

  const admin = await db.collection("admins").doc(request.auth.uid).get();
  if (!admin.exists) {
    throw new HttpsError("permission-denied", "Administrator access is required.");
  }
}

function validateDisplayName(value) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 80) {
    throw new HttpsError("invalid-argument", "Enter a display name up to 80 characters long.");
  }
  return value.trim();
}

function validatePassword(value, optional = false) {
  if (optional && value === "") return undefined;
  if (typeof value !== "string" || value.length < 6) {
    throw new HttpsError("invalid-argument", "Passwords must be at least 6 characters long.");
  }
  return value;
}

async function setAdminStatus(uid, isAdmin, callerUid) {
  const adminRef = db.collection("admins").doc(uid);
  return db.runTransaction(async (transaction) => {
    const adminSnapshot = await transaction.get(adminRef);
    const wasAdmin = adminSnapshot.exists;
    if (wasAdmin === isAdmin) return wasAdmin;

    if (!isAdmin) {
      if (uid === callerUid) {
        throw new HttpsError("failed-precondition", "You cannot remove your own administrator access.");
      }
      const admins = await transaction.get(db.collection("admins"));
      if (admins.size <= 1) {
        throw new HttpsError("failed-precondition", "At least one administrator must remain.");
      }
      transaction.delete(adminRef);
    } else {
      transaction.set(adminRef, { createdAt: new Date().toISOString() });
    }

    return wasAdmin;
  });
}

function convertAuthError(error) {
  if (error instanceof HttpsError) return error;
  if (error.code === "auth/email-already-exists") {
    return new HttpsError("already-exists", "An account with that email already exists.");
  }
  if (error.code === "auth/user-not-found") {
    return new HttpsError("not-found", "The requested user does not exist.");
  }
  if (error.code === "auth/invalid-email" || error.code === "auth/invalid-password" ||
      error.code === "auth/weak-password") {
    return new HttpsError("invalid-argument", "The email or password is invalid.");
  }
  console.error("User administration operation failed:", error);
  return new HttpsError("internal", "The user operation could not be completed.");
}

exports.adminListUsers = onCall(async (request) => {
  await requireAdmin(request);

  try {
    const records = [];
    let pageToken;
    do {
      const page = await auth.listUsers(1000, pageToken);
      records.push(...page.users);
      pageToken = page.pageToken;
    } while (pageToken);

    const users = [];
    for (let start = 0; start < records.length; start += 400) {
      const batch = records.slice(start, start + 400);
      const references = batch.flatMap((user) => [
        db.collection("users").doc(user.uid),
        db.collection("admins").doc(user.uid)
      ]);
      const snapshots = await db.getAll(...references);

      batch.forEach((user, index) => {
        const profile = snapshots[index * 2];
        const admin = snapshots[index * 2 + 1];
        users.push({
          uid: user.uid,
          email: user.email || "",
          displayName: (profile.exists && profile.get("displayName")) ||
            user.displayName || (user.email ? user.email.split("@")[0] : "Member"),
          isAdmin: admin.exists
        });
      });
    }

    users.sort((first, second) => first.email.localeCompare(second.email));
    return { users };
  } catch (error) {
    throw convertAuthError(error);
  }
});

exports.adminCreateUser = onCall(async (request) => {
  await requireAdmin(request);

  const data = request.data || {};
  const email = typeof data.email === "string" ? data.email.trim() : "";
  const displayName = validateDisplayName(data.displayName);
  const password = validatePassword(data.password);
  if (!email || typeof data.isAdmin !== "boolean") {
    throw new HttpsError("invalid-argument", "An email and admin status are required.");
  }

  let user;
  try {
    user = await auth.createUser({ email, displayName, password });
  } catch (error) {
    throw convertAuthError(error);
  }

  try {
    const batch = db.batch();
    batch.set(db.collection("users").doc(user.uid), {
      displayName,
      email,
      updatedAt: new Date().toISOString()
    });
    if (data.isAdmin) {
      batch.set(db.collection("admins").doc(user.uid), {
        createdAt: new Date().toISOString()
      });
    }
    await batch.commit();
    return { uid: user.uid };
  } catch (error) {
    try {
      await auth.deleteUser(user.uid);
    } catch (cleanupError) {
      console.error("Could not roll back newly created user:", cleanupError);
    }
    throw convertAuthError(error);
  }
});

exports.adminUpdateUser = onCall(async (request) => {
  await requireAdmin(request);

  const data = request.data || {};
  if (typeof data.uid !== "string" || !data.uid) {
    throw new HttpsError("invalid-argument", "A user ID is required.");
  }
  const displayName = validateDisplayName(data.displayName);
  const password = validatePassword(data.password, true);
  if (typeof data.isAdmin !== "boolean") {
    throw new HttpsError("invalid-argument", "An admin status is required.");
  }

  const previousAdminStatus = await setAdminStatus(data.uid, data.isAdmin, request.auth.uid);
  try {
    const updates = { displayName };
    if (password) updates.password = password;
    const user = await auth.updateUser(data.uid, updates);
    await db.collection("users").doc(data.uid).set({
      displayName,
      email: user.email || "",
      updatedAt: new Date().toISOString()
    });
    return { uid: user.uid };
  } catch (error) {
    if (previousAdminStatus !== data.isAdmin) {
      try {
        await setAdminStatus(data.uid, previousAdminStatus, request.auth.uid);
      } catch (rollbackError) {
        console.error("Could not roll back admin status after a failed user update:", rollbackError);
      }
    }
    throw convertAuthError(error);
  }
});

exports.adminDeleteUser = onCall(async (request) => {
  await requireAdmin(request);

  const uid = request.data && request.data.uid;
  if (typeof uid !== "string" || !uid) {
    throw new HttpsError("invalid-argument", "A user ID is required.");
  }
  if (uid === request.auth.uid) {
    throw new HttpsError("failed-precondition", "You cannot delete the account you are using.");
  }

  try {
    await auth.deleteUser(uid);
    const batch = db.batch();
    batch.delete(db.collection("users").doc(uid));
    batch.delete(db.collection("admins").doc(uid));
    await batch.commit();
    return { uid };
  } catch (error) {
    throw convertAuthError(error);
  }
});

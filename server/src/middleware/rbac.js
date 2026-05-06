const mongoose = require('mongoose');
const Membership = require('../models/Membership');
const { HttpError } = require('../utils/httpError');

function toObjectId(id) {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch {
    return null;
  }
}

/**
 * Ensures the user is a member of the project.
 * Adds req.membership = { role, projectId, userId }
 */
function requireProjectMember(getProjectId) {
  return async (req, _res, next) => {
    const projectIdRaw = getProjectId(req);
    const projectId = toObjectId(projectIdRaw);
    if (!projectId) return next(new HttpError(400, 'VALIDATION_ERROR', 'Invalid projectId'));

    const membership = await Membership.findOne({ projectId, userId: req.user.id }).lean();
    if (!membership) return next(new HttpError(403, 'FORBIDDEN', 'Not a member of this project'));

    req.membership = membership;
    next();
  };
}

function requireProjectRole(allowedRoles) {
  return (req, _res, next) => {
    if (!req.membership) return next(new HttpError(500, 'INTERNAL', 'Membership missing in request'));
    if (!allowedRoles.includes(req.membership.role)) {
      return next(new HttpError(403, 'FORBIDDEN', 'Insufficient role'));
    }
    next();
  };
}

module.exports = { requireProjectMember, requireProjectRole };

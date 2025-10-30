const jwt = require('jsonwebtoken');

function authMiddleware(roles = [], departments = []) {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
      if (err) return res.status(403).json({ message: 'Invalid token' });

      // ✅ Role check
      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({ message: 'Access denied: role' });
      }

      // ✅ Department check for staff users only (admins and pantry bypass department check)
      if (departments.length && user.role === 'staff') {
        let userDepartments = [];

        // If user.department is an array
        if (Array.isArray(user.department)) {
          userDepartments = user.department.map(dep => dep.name?.toLowerCase());
        }
        // If user.department is a single object
        else if (user.department && typeof user.department === 'object') {
          userDepartments = [user.department.name?.toLowerCase()];
        }
        // If user.department is a plain string
        else if (typeof user.department === 'string') {
          userDepartments = [user.department.toLowerCase()];
        }

        const allowedDepartments = departments.map(dep => dep.toLowerCase());

        const hasAccess = userDepartments.some(dep => allowedDepartments.includes(dep));

        if (!hasAccess) {
          return res.status(403).json({ message: 'Access denied: department' });
        }
      }

      req.user = user;
      next();
    });
  };
}

// Middleware to restrict pantry users to only pantry routes
function restrictPantryAccess(req, res, next) {
  // Skip auth routes
  if (req.path.startsWith('/api/auth')) {
    return next();
  }
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return next(); // Let other middleware handle auth

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
    if (err) return next(); // Let other middleware handle auth errors
    
    if (user.role === 'pantry') {
      const allowedPaths = [
        '/pantry', 
        '/pantry-categories', 
        '/dashboard', 
        '/vendor',
        '/inventory',
        '/purchase-orders'
      ];
      const isAllowed = allowedPaths.some(path => req.path.startsWith(path));
      
      if (!isAllowed) {
        return res.status(403).json({ message: 'Access denied: pantry users can only access pantry routes' });
      }
    }
    
    next();
  });
}

module.exports = { authMiddleware, restrictPantryAccess };

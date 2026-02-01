import { dbGet } from '../server.js';

/**
 * Middleware to ensure user has an active company context
 * Extracts company_id from request (body/query/params) and validates access
 */
export async function requireCompanyContext(req, res, next) {
  const userId = req.user.id;
  
  // Get company_id from body, query params, or route params
  const companyId = req.body.company_id || req.query.company_id || req.params.company_id || req.params.companyId;
  
  if (!companyId) {
    return res.status(400).json({ 
      error: 'Company context required',
      code: 'MISSING_COMPANY_CONTEXT',
      message: 'Please select a company before performing this action'
    });
  }

  try {
    // Verify user has access to this company
    const access = await dbGet(
      'SELECT * FROM user_companies WHERE user_id = ? AND company_id = ?',
      [userId, companyId]
    );

    if (!access) {
      return res.status(403).json({ 
        error: 'Access denied',
        code: 'INVALID_COMPANY_ACCESS',
        message: 'You do not have access to this company'
      });
    }

    // Attach company context to request
    req.companyId = parseInt(companyId);
    req.companyAccess = access;
    
    next();
  } catch (err) {
    console.error('Company context validation error:', err);
    res.status(500).json({ error: 'Failed to validate company context' });
  }
}

/**
 * Middleware to extract company_id from user's current company
 * Falls back to current_company_id from users table
 */
export async function useCurrentCompany(req, res, next) {
  const userId = req.user.id;
  
  try {
    // Check if company_id is provided in request
    let companyId = req.body.company_id || req.query.company_id || req.params.company_id || req.params.companyId;
    
    // If not provided, get user's current company
    if (!companyId) {
      const user = await dbGet('SELECT current_company_id FROM users WHERE id = ?', [userId]);
      companyId = user?.current_company_id;
    }
    
    if (!companyId) {
      return res.status(400).json({ 
        error: 'No active company',
        code: 'NO_ACTIVE_COMPANY',
        message: 'Please select a company first'
      });
    }

    // Verify access
    const access = await dbGet(
      'SELECT * FROM user_companies WHERE user_id = ? AND company_id = ?',
      [userId, companyId]
    );

    if (!access) {
      return res.status(403).json({ 
        error: 'Access denied',
        code: 'INVALID_COMPANY_ACCESS'
      });
    }

    req.companyId = parseInt(companyId);
    req.companyAccess = access;
    
    next();
  } catch (err) {
    console.error('Current company middleware error:', err);
    res.status(500).json({ error: 'Failed to load company context' });
  }
}

/**
 * Helper to validate company ownership (owner role)
 */
export async function requireCompanyOwnership(req, res, next) {
  if (req.companyAccess && req.companyAccess.role === 'owner') {
    next();
  } else {
    res.status(403).json({ 
      error: 'Owner access required',
      code: 'REQUIRES_OWNER',
      message: 'Only company owners can perform this action'
    });
  }
}

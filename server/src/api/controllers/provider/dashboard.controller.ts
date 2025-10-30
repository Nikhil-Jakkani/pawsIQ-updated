import { Request, Response } from 'express';
import dashboardService from '../../services/provider/dashboard.service.js';

/**
 * Provider Dashboard Controller
 * Handles HTTP requests for provider dashboard data
 */

interface AuthenticatedProviderRequest extends Request {
  user?: {
    service_provider_id: number;
    serv_provider_type: string;
    serv_provider_email: string;
  };
}

/**
 * @route GET /api/v1/provider/dashboard/metrics
 * @desc Get dashboard metrics for authenticated provider
 * @access Private (Provider only)
 */
export const getDashboardMetrics = async (req: AuthenticatedProviderRequest, res: Response) => {
  try {
    const providerId = req.user?.service_provider_id;

    if (!providerId) {
      return res.status(401).json({
        success: false,
        message: 'Provider authentication required',
      });
    }

    const metrics = await dashboardService.getDashboardMetrics(providerId);

    return res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    console.error('Error in getDashboardMetrics:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch dashboard metrics',
    });
  }
};

/**
 * @route GET /api/v1/provider/dashboard/revenue
 * @desc Get revenue metrics for authenticated provider
 * @access Private (Provider only)
 */
export const getRevenueMetrics = async (req: AuthenticatedProviderRequest, res: Response) => {
  try {
    const providerId = req.user?.service_provider_id;

    if (!providerId) {
      return res.status(401).json({
        success: false,
        message: 'Provider authentication required',
      });
    }

    const revenue = await dashboardService.getRevenueMetrics(providerId);

    return res.status(200).json({
      success: true,
      data: revenue,
    });
  } catch (error: any) {
    console.error('Error in getRevenueMetrics:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch revenue metrics',
    });
  }
};

/**
 * @route GET /api/v1/provider/dashboard/appointments
 * @desc Get recent appointments for authenticated provider
 * @access Private (Provider only)
 */
export const getRecentAppointments = async (req: AuthenticatedProviderRequest, res: Response) => {
  try {
    const providerId = req.user?.service_provider_id;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!providerId) {
      return res.status(401).json({
        success: false,
        message: 'Provider authentication required',
      });
    }

    const appointments = await dashboardService.getRecentAppointments(providerId, limit);

    return res.status(200).json({
      success: true,
      data: appointments,
    });
  } catch (error: any) {
    console.error('Error in getRecentAppointments:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch recent appointments',
    });
  }
};

/**
 * @route GET /api/v1/provider/dashboard/clients
 * @desc Get clients for authenticated provider
 * @access Private (Provider only)
 */
export const getClients = async (req: AuthenticatedProviderRequest, res: Response) => {
  try {
    const providerId = req.user?.service_provider_id;

    if (!providerId) {
      return res.status(401).json({
        success: false,
        message: 'Provider authentication required',
      });
    }

    const clients = await dashboardService.getClients(providerId);

    return res.status(200).json({
      success: true,
      data: clients,
    });
  } catch (error: any) {
    console.error('Error in getClients:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch clients',
    });
  }
};

/**
 * @route GET /api/v1/provider/dashboard/type-metrics
 * @desc Get provider-type-specific metrics
 * @access Private (Provider only)
 */
export const getTypeSpecificMetrics = async (req: AuthenticatedProviderRequest, res: Response) => {
  try {
    const providerId = req.user?.service_provider_id;
    const providerType = req.user?.serv_provider_type;

    if (!providerId || !providerType) {
      return res.status(401).json({
        success: false,
        message: 'Provider authentication required',
      });
    }

    const metrics = await dashboardService.getTypeSpecificMetrics(providerId, providerType);

    return res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    console.error('Error in getTypeSpecificMetrics:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch type-specific metrics',
    });
  }
};

/**
 * @route GET /api/v1/provider/dashboard/overview
 * @desc Get complete dashboard overview (all metrics in one call)
 * @access Private (Provider only)
 */
export const getDashboardOverview = async (req: AuthenticatedProviderRequest, res: Response) => {
  try {
    const providerId = req.user?.service_provider_id;
    const providerType = req.user?.serv_provider_type;

    if (!providerId || !providerType) {
      return res.status(401).json({
        success: false,
        message: 'Provider authentication required',
      });
    }

    // Fetch all data in parallel for better performance
    const [metrics, revenue, appointments, clients, typeMetrics] = await Promise.all([
      dashboardService.getDashboardMetrics(providerId),
      dashboardService.getRevenueMetrics(providerId),
      dashboardService.getRecentAppointments(providerId, 5),
      dashboardService.getClients(providerId),
      dashboardService.getTypeSpecificMetrics(providerId, providerType),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        metrics,
        revenue,
        recentAppointments: appointments,
        clients: clients.slice(0, 10), // Limit to top 10 clients
        typeSpecificMetrics: typeMetrics,
        providerType,
      },
    });
  } catch (error: any) {
    console.error('Error in getDashboardOverview:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch dashboard overview',
    });
  }
};

export default {
  getDashboardMetrics,
  getRevenueMetrics,
  getRecentAppointments,
  getClients,
  getTypeSpecificMetrics,
  getDashboardOverview,
};

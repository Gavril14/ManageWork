// ═══ API SERVICE — Connects frontend to backend ═══
// All API calls go through this service
// Handles JWT tokens, company ID header, error handling

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('cms_token') || null;
    this.refreshToken = localStorage.getItem('cms_refresh_token') || null;
    this.companyId = localStorage.getItem('cms_company_id') || null;
  }

  // ── Set auth tokens ──
  setTokens(token, refreshToken) {
    this.token = token;
    this.refreshToken = refreshToken;
    localStorage.setItem('cms_token', token);
    if (refreshToken) localStorage.setItem('cms_refresh_token', refreshToken);
  }

  setCompanyId(id) {
    this.companyId = id;
    localStorage.setItem('cms_company_id', id);
  }

  clearAuth() {
    this.token = null;
    this.refreshToken = null;
    this.companyId = null;
    localStorage.removeItem('cms_token');
    localStorage.removeItem('cms_refresh_token');
    localStorage.removeItem('cms_company_id');
  }

  // ── Base fetch with auth headers ──
  async request(method, path, body = null, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
      ...(this.companyId ? { 'X-Company-ID': this.companyId } : {}),
      ...options.headers,
    };

    const config = { method, headers };
    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    try {
      let response = await fetch(`${API_BASE}${path}`, config);

      // Auto-refresh on 401
      if (response.status === 401 && this.refreshToken && path !== '/auth/refresh') {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          headers['Authorization'] = `Bearer ${this.token}`;
          response = await fetch(`${API_BASE}${path}`, { ...config, headers });
        }
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      return data;
    } catch (err) {
      console.error(`API Error [${method} ${path}]:`, err.message);
      throw err;
    }
  }

  async refreshAccessToken() {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
      const data = await res.json();
      if (data.success && data.data.token) {
        this.setTokens(data.data.token, this.refreshToken);
        return true;
      }
      this.clearAuth();
      return false;
    } catch {
      this.clearAuth();
      return false;
    }
  }

  // ── Multipart upload (photos, files) ──
  async upload(path, file, fields = {}) {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(fields).forEach(([k, v]) => formData.append(k, v));

    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: {
        ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
        ...(this.companyId ? { 'X-Company-ID': this.companyId } : {}),
      },
      body: formData,
    });
    return response.json();
  }

  // ── Convenience methods ──
  get(path) { return this.request('GET', path); }
  post(path, body) { return this.request('POST', path, body); }
  put(path, body) { return this.request('PUT', path, body); }
  del(path) { return this.request('DELETE', path); }

  // ═══ AUTH ═══
  async login(email, password) {
    const res = await this.post('/auth/login', { email, password });
    if (res.success) {
      this.setTokens(res.data.token, res.data.refreshToken);
      const companies = JSON.parse(res.data.user.companyAccess || '[]');
      if (companies.length > 0) this.setCompanyId(companies[0]);
    }
    return res;
  }

  async register(data) { return this.post('/auth/register', data); }
  async getMe() { return this.get('/auth/me'); }

  // ═══ COMPANIES ═══
  async getCompanies() { return this.get('/companies'); }
  async getCompany(id) { return this.get(`/companies/${id}`); }
  async updateCompany(id, data) { return this.put(`/companies/${id}`, data); }

  // ═══ PROJECTS ═══
  async getProjects() { return this.get('/projects'); }
  async createProject(data) { return this.post('/projects', data); }
  async getProject(id) { return this.get(`/projects/${id}`); }
  async updateProject(id, data) { return this.put(`/projects/${id}`, data); }
  async deleteProject(id) { return this.del(`/projects/${id}`); }
  async getProjectProperties(id) { return this.get(`/projects/${id}/properties`); }

  // ═══ PROPERTIES ═══
  async createProperty(projectId, data) { return this.post(`/projects/${projectId}/properties`, data); }
  async getProperty(id) { return this.get(`/properties/${id}`); }
  async updateProperty(id, data) { return this.put(`/properties/${id}`, data); }
  async updatePropertyStatus(id, status) { return this.put(`/properties/${id}/status`, { status }); }
  async updateTrackerTask(propertyId, taskKey, data) { return this.put(`/properties/${propertyId}/tracker/${taskKey}`, data); }
  async addPropertyTask(propertyId, data) { return this.post(`/properties/${propertyId}/tasks`, data); }
  async uploadPropertyPhoto(propertyId, file, category) { return this.upload(`/properties/${propertyId}/photos`, file, { category }); }

  // ═══ WORKFORCE ═══
  async getSubcontractors() { return this.get('/subcontractors'); }
  async createSubcontractor(data) { return this.post('/subcontractors', data); }
  async updateSubcontractor(id, data) { return this.put(`/subcontractors/${id}`, data); }
  async getOperatives() { return this.get('/operatives'); }
  async createOperative(data) { return this.post('/operatives', data); }
  async updateOperative(id, data) { return this.put(`/operatives/${id}`, data); }

  // ═══ TIMESHEETS ═══
  async getTimesheets(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.get(`/timesheets${qs ? '?' + qs : ''}`);
  }
  async createTimesheet(data) { return this.post('/timesheets', data); }
  async approveTimesheet(id) { return this.put(`/timesheets/${id}/approve`); }
  async deleteTimesheet(id) { return this.del(`/timesheets/${id}`); }
  async getTimesheetSummary(weekStart) { return this.get(`/timesheets/summary/weekly?weekStart=${weekStart}`); }

  // ═══ CLOCK IN/OUT ═══
  async getClockIns() { return this.get('/clock-ins'); }
  async getActiveClockIns() { return this.get('/clock-ins/active/now'); }
  async forceClockOut(id) { return this.put(`/clock-ins/${id}/force-out`); }

  // ═══ FINANCIAL ═══
  async getInvoices() { return this.get('/invoices'); }
  async createInvoice(data) { return this.post('/invoices', data); }
  async getQuotes() { return this.get('/quotes'); }
  async createQuote(data) { return this.post('/quotes', data); }
  async getEstimates() { return this.get('/estimates'); }
  async createEstimate(data) { return this.post('/estimates', data); }
  async convertEstimateToQuote(id) { return this.post(`/estimates/${id}/convert`); }
  async getPurchaseOrders() { return this.get('/purchase-orders'); }
  async createPurchaseOrder(data) { return this.post('/purchase-orders', data); }
  async getPaymentApps() { return this.get('/payment-apps'); }
  async createPaymentApp(data) { return this.post('/payment-apps', data); }
  async getVariationOrders() { return this.get('/variation-orders'); }

  // ═══ CONTACTS ═══
  async getClients() { return this.get('/clients'); }
  async createClient(data) { return this.post('/clients', data); }
  async getSuppliers() { return this.get('/suppliers'); }
  async createSupplier(data) { return this.post('/suppliers', data); }
  async getSupplierPrices(id) { return this.get(`/suppliers/${id}/prices`); }

  // ═══ ASSETS ═══
  async getVehicles() { return this.get('/vehicles'); }
  async createVehicle(data) { return this.post('/vehicles', data); }
  async getTools() { return this.get('/tools'); }
  async createTool(data) { return this.post('/tools', data); }

  // ═══ SMS & WHATSAPP ═══
  async sendSms(data) { return this.post('/sms/send', data); }
  async getSmsHistory() { return this.get('/sms/history'); }
  async getSmsGroups() { return this.get('/sms/groups'); }
  async getSmsTemplates() { return this.get('/sms/templates'); }
  async getWhatsappInbox() { return this.get('/whatsapp/inbox'); }
  async getWhatsappConversations() { return this.get('/whatsapp/conversations'); }
  async sendWhatsapp(data) { return this.post('/whatsapp/send', data); }
  async broadcastWhatsapp(data) { return this.post('/whatsapp/broadcast', data); }
  async markWhatsappRead(id) { return this.put(`/whatsapp/inbox/${id}/read`); }
  async logIncomingWhatsapp(data) { return this.post('/whatsapp/inbox', data); }
  async getWhatsappTemplates() { return this.get('/whatsapp/templates'); }

  // ═══ COMPLIANCE ═══
  async getPolicies() { return this.get('/compliance/policies'); }
  async createPolicy(data) { return this.post('/compliance/policies', data); }
  async getRams() { return this.get('/compliance/rams'); }
  async getToolboxTalks() { return this.get('/compliance/toolbox-talks'); }
  async createToolboxTalk(data) { return this.post('/compliance/toolbox-talks', data); }
  async signToolboxTalk(id, data) { return this.put(`/compliance/toolbox-talks/${id}/sign`, data); }
  async getTrainingMatrix() { return this.get('/compliance/training'); }
  async getAccreditations() { return this.get('/compliance/accreditations'); }
  async getComplianceDocs() { return this.get('/compliance/documents'); }
  async getSiteInspections() { return this.get('/compliance/inspections'); }
  async createSiteInspection(data) { return this.post('/compliance/inspections', data); }
  async getAgreements() { return this.get('/compliance/agreements'); }
  async createAgreement(data) { return this.post('/compliance/agreements', data); }
  async getIncidents() { return this.get('/compliance/incidents'); }

  // ═══ HMRC ═══
  async hmrcConnect() { return this.get('/hmrc/connect'); }
  async cisVerify(subId) { return this.post('/hmrc/cis/verify', { subcontractorId: subId }); }
  async getCisReturn(month) { return this.get(`/hmrc/cis/return?month=${month}`); }
  async submitCisReturn(data) { return this.post('/hmrc/cis/return', data); }
  async getCisReturns() { return this.get('/hmrc/cis/returns'); }
  async calculateVatReturn(from, to) { return this.get(`/hmrc/vat/calculate?from=${from}&to=${to}`); }
  async submitVatReturn(data) { return this.post('/hmrc/vat/return', data); }
  async getVatReturns() { return this.get('/hmrc/vat/returns'); }
  async getVatObligations() { return this.get('/hmrc/vat/obligations'); }

  // ═══ BANKING ═══
  async getSupportedBanks() { return this.get('/banking/banks'); }
  async getBankConnections() { return this.get('/banking/connections'); }
  async connectBank(data) { return this.post('/banking/connect', data); }
  async syncBankTransactions(connectionId) { return this.post(`/banking/connections/${connectionId}/sync`); }
  async getBankBalance(connectionId) { return this.get(`/banking/connections/${connectionId}/balance`); }
  async getBankTransactions(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.get(`/banking/transactions${qs ? '?' + qs : ''}`);
  }
  async reconcileTransaction(id, reconciledWith) { return this.put(`/banking/transactions/${id}/reconcile`, { reconciledWith }); }
  async autoReconcile() { return this.post('/banking/auto-reconcile'); }
  async disconnectBank(id) { return this.del(`/banking/connections/${id}`); }
  async getPaymentRecords() { return this.get('/banking/payments'); }
  async recordPayment(data) { return this.post('/banking/payments', data); }

  // ═══ COMMS & CALENDAR ═══
  async getCommLog() { return this.get('/comm-log'); }
  async createCommLog(data) { return this.post('/comm-log', data); }
  async getCalendarEvents() { return this.get('/calendar'); }
  async createCalendarEvent(data) { return this.post('/calendar', data); }
  async getTodos() { return this.get('/todos'); }
  async createTodo(data) { return this.post('/todos', data); }
  async updateTodo(id, data) { return this.put(`/todos/${id}`, data); }
  async getSchedules() { return this.get('/schedules'); }
  async createSchedule(data) { return this.post('/schedules', data); }

  // ═══ ADMIN ═══
  async getUsers() { return this.get('/users'); }
  async createUser(data) { return this.post('/users', data); }
  async updateUser(id, data) { return this.put(`/users/${id}`, data); }
  async getClientPortalAccess() { return this.get('/users/client-access'); }
  async createClientPortalAccess(data) { return this.post('/users/client-access', data); }
  async getPortalUsers() { return this.get('/users/portal-users'); }
  async createPortalUser(data) { return this.post('/users/portal-users', data); }
  async getAuditLog() { return this.get('/audit-log'); }
  async getReportFinancial() { return this.get('/reports/financial'); }
  async getReportProjectStatus() { return this.get('/reports/project-status'); }
  async getReportWorkforce() { return this.get('/reports/workforce'); }
  async getReportSnags() { return this.get('/reports/snags'); }

  // ═══ SEARCH ═══
  async globalSearch(q) { return this.get(`/search?q=${encodeURIComponent(q)}`); }
  async addressSearch(q) { return this.get(`/integrations/address-search?q=${encodeURIComponent(q)}`); }

  // ═══ AI ═══
  async aiChat(systemPrompt, userMessage) { return this.post('/integrations/ai/chat', { systemPrompt, userMessage }); }

  // ═══ UPLOAD ═══
  async uploadFile(file, folder) { return this.upload('/upload', file, { folder }); }
  async getPresignedUrl(filename, contentType, folder) { return this.post('/upload/presigned', { filename, contentType, folder }); }

  // ═══ NOTIFICATIONS ═══
  async getNotifications() { return this.get('/notifications'); }

  // ═══ PLATFORM ADMIN ═══
  async getTenants() { return this.get('/admin/tenants'); }
  async createTenant(data) { return this.post('/admin/tenants', data); }
  async getRevenue() { return this.get('/admin/revenue'); }
}

// Singleton export
const api = new ApiService();
export default api;

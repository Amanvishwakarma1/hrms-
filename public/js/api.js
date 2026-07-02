class ApiService {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    getHeaders(isFormData = false) {
        const token = localStorage.getItem('adminToken');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (!isFormData) headers['Content-Type'] = 'application/json';
        return headers;
    }

    async request(endpoint, options = {}, isFormData = false) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers: this.getHeaders(isFormData)
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'API Request Failed');
            }
            return data;
        } catch (error) {
            console.error(`API Error on ${endpoint}:`, error);
            throw error;
        }
    }

    // Auth
    login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    // Employees
    getEmployees() {
        return this.request('/employees');
    }

    // Attendance
    getAttendance() {
        return this.request('/attendance');
    }

    // Leaves
    getLeaves() {
        return this.request('/leaves');
    }

    updateLeaveStatus(leaveId, status) {
        return this.request(`/leaves/${leaveId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    }

    // Geofence
    getGeofence() {
        return this.request('/geofence');
    }

    updateGeofence(payload) {
        return this.request('/geofence', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }

    // Footprints
    getFootprints(userId) {
        return this.request(`/footprints${userId ? `?userId=${userId}` : ''}`);
    }

    getLiveFootprints() {
        return this.request('/footprints/live');
    }

    getFootprintHistory(userId, date) {
        return this.request(`/footprints/history?userId=${userId}&date=${date}`);
    }

    // Expenses
    getExpenses() {
        return this.request('/expenses');
    }

    updateExpenseStatus(expenseId, status) {
        return this.request(`/expenses/${expenseId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    }

    // Documents
    getDocuments() {
        return this.request('/documents');
    }

    uploadDocument(formData) {
        return this.request('/documents', {
            method: 'POST',
            body: formData
        }, true); // isFormData = true
    }

    // Media
    getMedia() {
        return this.request('/media');
    }
}

const api = new ApiService(CONFIG.API_BASE_URL);

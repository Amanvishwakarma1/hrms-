document.addEventListener('DOMContentLoaded', () => {
    
    // --- Elements ---
    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');
    const adminNameEl = document.getElementById('admin-name');
    const currentViewTitle = document.getElementById('current-view-title');

    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');

    // State
    let adminUser = JSON.parse(localStorage.getItem('adminUser'));
    let token = localStorage.getItem('adminToken');
    let liveMap = null;
    let replayMap = null;
    let allEmployees = [];
    let currentExpenseTab = 'pending';
    let currentDocTab = 'employees';

    // --- Date Formatter Fix ---
    function formatDate(val, includeTime = false) {
        if (!val) return '-';
        let d = new Date(val);
        if (isNaN(d.getTime()) && !isNaN(Number(val))) {
            d = new Date(Number(val));
        }
        if (isNaN(d.getTime())) return String(val);
        
        if (includeTime) {
            return d.toLocaleString();
        }
        return d.toLocaleDateString();
    }

    // Resolve URL for media and documents
    function getFullUrl(filePath) {
        if (!filePath) return '';
        
        // If it's a Cloudinary URL, return it directly
        if (filePath.includes('cloudinary.com')) return filePath;

        // If the database stored a full URL (like http://localhost:8000/static/...)
        // we should strip the host and force it to use the live Render backend
        let pathOnly = filePath;
        try {
            if (filePath.startsWith('http')) {
                const urlObj = new URL(filePath);
                pathOnly = urlObj.pathname;
            }
        } catch(e) {}

        let serverUrl = CONFIG.API_BASE_URL;
        if (serverUrl.endsWith('/api')) serverUrl = serverUrl.substring(0, serverUrl.length - 4);
        if (serverUrl.endsWith('/api/')) serverUrl = serverUrl.substring(0, serverUrl.length - 5);
        if (serverUrl.endsWith('/')) serverUrl = serverUrl.substring(0, serverUrl.length - 1);

        return `${serverUrl}/${pathOnly.startsWith('/') ? pathOnly.substring(1) : pathOnly}`;
    }

    // Force download cross-origin files by fetching as blob
    window.forceDownload = async function(url, defaultFilename) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network error');
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = blobUrl;
            
            // Try to guess filename from URL or use default
            let filename = defaultFilename;
            try {
                const urlObj = new URL(url);
                const parts = urlObj.pathname.split('/');
                const last = parts[parts.length - 1];
                if (last && last.includes('.')) filename = last;
            } catch(e) {}
            
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Blob download failed, falling back to direct navigation:', error);
            const a = document.createElement('a');
            a.href = url;
            a.download = defaultFilename;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    // Watermark image with GPS data before downloading
    window.downloadWithWatermark = async function(url, filename, textLines) {
        try {
            // Fetch as blob to ensure cross-origin works
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network error');
            const blob = await response.blob();
            const objectUrl = window.URL.createObjectURL(blob);

            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                
                // Draw original image
                ctx.drawImage(img, 0, 0);

                // Add semi-transparent background for text at the bottom
                // Base font size on image width (5% of width) with a minimum of 20px so it's readable on any resolution
                const fontSize = Math.max(20, Math.floor(img.width * 0.05)); 
                const padding = fontSize;
                const lineHeight = fontSize * 1.5;
                const overlayHeight = (textLines.length * lineHeight) + padding;
                
                ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                ctx.fillRect(0, img.height - overlayHeight, img.width, overlayHeight);

                // Draw text
                ctx.fillStyle = '#ffffff';
                ctx.font = `${fontSize}px sans-serif`;
                ctx.textBaseline = 'top';

                textLines.forEach((line, index) => {
                    ctx.fillText(line, padding, img.height - overlayHeight + (padding / 2) + (index * lineHeight));
                });

                // Convert canvas to blob and download
                canvas.toBlob((watermarkedBlob) => {
                    const downloadUrl = window.URL.createObjectURL(watermarkedBlob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = downloadUrl;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(downloadUrl);
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(objectUrl);
                }, 'image/jpeg', 0.95);
            };
            img.src = objectUrl;
        } catch (error) {
            console.error('Watermark download failed, falling back to original:', error);
            window.forceDownload(url, filename);
        }
    };

    // --- Initialization ---
    function init() {
        if (adminUser && token && adminUser.role === 'ADMIN') {
            showDashboard();
        } else {
            showLogin();
        }
    }

    // --- Auth Logic ---
    function showLogin() {
        loginScreen.classList.remove('hidden');
        dashboardScreen.classList.add('hidden');
    }

    function showDashboard() {
        loginScreen.classList.add('hidden');
        dashboardScreen.classList.remove('hidden');
        adminNameEl.textContent = adminUser.name;
        loadDashboardData();
        loadEmployeesData(); // preload for dropdowns
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const btn = document.getElementById('login-btn');
        
        try {
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            btn.disabled = true;
            loginError.classList.add('hidden');
            
            const res = await api.login(email, password);
            if (res.user && res.user.role === 'ADMIN') {
                localStorage.setItem('adminUser', JSON.stringify(res.user));
                localStorage.setItem('adminToken', res.token);
                adminUser = res.user;
                token = res.token;
                showDashboard();
            } else {
                throw new Error("Access Denied: Admins only.");
            }
        } catch (error) {
            loginError.textContent = error.message;
            loginError.classList.remove('hidden');
        } finally {
            btn.innerHTML = '<span>Sign In</span><i class="fa-solid fa-arrow-right"></i>';
            btn.disabled = false;
        }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('adminUser');
        localStorage.removeItem('adminToken');
        adminUser = null;
        token = null;
        showLogin();
    });

    // --- Navigation Logic ---
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const viewId = item.getAttribute('data-view');
            
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            views.forEach(view => {
                view.classList.add('hidden');
                view.classList.remove('active');
            });
            const targetView = document.getElementById(viewId);
            targetView.classList.remove('hidden');
            
            setTimeout(() => targetView.classList.add('active'), 10);
            currentViewTitle.textContent = item.querySelector('span').textContent;

            // Load data
            if (viewId === 'employees-view') renderEmployeesTable();
            if (viewId === 'attendance-view') loadAttendance();
            if (viewId === 'leaves-view') loadLeaves();
            if (viewId === 'expenses-view') loadExpenses();
            if (viewId === 'documents-view') loadDocuments();
            if (viewId === 'media-view') loadMedia();
            if (viewId === 'dashboard-view') loadDashboardData();
            if (viewId === 'geofence-view') loadGeofence();
            if (viewId === 'live-tracking-view') initLiveMap();
            if (viewId === 'route-replay-view') initReplayMap();
        });
    });

    // --- Helper to trigger navigation programmatically ---
    window.navigateTo = function(viewId) {
        const targetNav = document.querySelector(`.nav-item[data-view="${viewId}"]`);
        if (targetNav) targetNav.click();
    };

    // --- Preload Employees ---
    async function loadEmployeesData() {
        try {
            allEmployees = await api.getEmployees();
            populateEmployeeDropdowns();
        } catch(e) {
            console.error("Failed to fetch employees", e);
        }
    }

    function populateEmployeeDropdowns() {
        const optionsHTML = allEmployees.map(emp => `<option value="${emp.id}">${emp.name}</option>`).join('');
        
        document.getElementById('live-emp-select').innerHTML = `<option value="all">All Employees (Recent)</option>` + optionsHTML;
        document.getElementById('replay-emp-select').innerHTML = `<option value="">-- Select Employee --</option>` + optionsHTML;
        
        // Also populate document target select
        const docTarget = document.getElementById('doc-target');
        if(docTarget) {
            docTarget.innerHTML = `<option value="ALL">All Employees</option>` + allEmployees.map(emp => `<option value="${emp.id}">${emp.name}</option>`).join('');
        }
    }

    // --- Data Loading (Tables) ---
    async function loadDashboardData() {
        try {
            if(allEmployees.length === 0) await loadEmployeesData();
            const [leaves, expenses] = await Promise.all([
                api.getLeaves(),
                api.getExpenses()
            ]);
            document.getElementById('stat-total-emp').textContent = allEmployees.length;
            const pendingLeaves = leaves.filter(l => l.status === 'pending').length;
            document.getElementById('stat-pending-leaves').textContent = pendingLeaves;
            const pendingExpenses = expenses.filter(e => e.status === 'pending').length;
            document.getElementById('stat-pending-expenses').textContent = pendingExpenses;
        } catch (e) {
            console.error(e);
        }
    }

    function renderEmployeesTable() {
        const tbody = document.querySelector('#employees-table tbody');
        if(!allEmployees.length) {
            tbody.innerHTML = '<tr><td colspan="4">No data or loading...</td></tr>';
            return;
        }
        tbody.innerHTML = allEmployees.map(emp => `
            <tr onclick="window.loadEmployeeTracking('${emp.id}', '${emp.name.replace(/'/g, "\\'")}')" style="cursor: pointer;" title="View Tracking Details">
                <td>${emp.id}</td>
                <td>${emp.name}</td>
                <td>${emp.email}</td>
                <td><span class="role-badge" style="margin-top:0">${emp.role}</span></td>
            </tr>
        `).join('');
    }

    async function loadAttendance() {
        const tbody = document.querySelector('#attendance-table tbody');
        tbody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
        try {
            const att = await api.getAttendance();
            tbody.innerHTML = att.map(record => `
                <tr>
                    <td>${formatDate(record.date)}</td>
                    <td>${record.userName}</td>
                    <td>${formatDate(record.checkIn, true)}</td>
                    <td>${record.checkOut ? formatDate(record.checkOut, true) : '-'}</td>
                </tr>
            `).join('');
        } catch (e) {
            tbody.innerHTML = '<tr><td colspan="4" class="error-text">Failed to load attendance</td></tr>';
        }
    }

    async function loadLeaves() {
        const tbody = document.querySelector('#leaves-table tbody');
        tbody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';
        try {
            const leaves = await api.getLeaves();
            tbody.innerHTML = leaves.map(leave => `
                <tr>
                    <td>${formatDate(leave.appliedAt)}</td>
                    <td>${leave.userName}</td>
                    <td>${formatDate(leave.startDate)} - ${formatDate(leave.endDate)}</td>
                    <td>${leave.reason}</td>
                    <td><span class="badge-status badge-${leave.status}">${leave.status.toUpperCase()}</span></td>
                    <td>
                        ${leave.status === 'pending' ? `
                            <button class="btn btn-success" onclick="window.updateLeave('${leave.id}', 'approved')"><i class="fa-solid fa-check"></i></button>
                            <button class="btn btn-danger" onclick="window.updateLeave('${leave.id}', 'rejected')"><i class="fa-solid fa-xmark"></i></button>
                        ` : '-'}
                    </td>
                </tr>
            `).join('');
        } catch (e) {
            tbody.innerHTML = '<tr><td colspan="6" class="error-text">Failed to load leaves</td></tr>';
        }
    }

    window.updateLeave = async (id, status) => {
        if (!confirm(`Are you sure you want to ${status} this leave?`)) return;
        try {
            await api.updateLeaveStatus(id, status);
            loadLeaves();
            loadDashboardData();
        } catch (e) {
            alert('Failed to update leave status: ' + e.message);
        }
    };

    // --- Expenses ---
    window.switchExpenseTab = function(tab) {
        currentExpenseTab = tab;
        document.getElementById('btn-exp-pending').classList.toggle('active', tab === 'pending');
        document.getElementById('btn-exp-history').classList.toggle('active', tab === 'history');
        loadExpenses();
    };

    async function loadExpenses() {
        const tbody = document.querySelector('#expenses-table tbody');
        tbody.innerHTML = '<tr><td colspan="8">Loading...</td></tr>';
        try {
            const expenses = await api.getExpenses();
            const filtered = expenses.filter(exp => 
                currentExpenseTab === 'pending' ? exp.status === 'pending' : exp.status !== 'pending'
            );

            if(filtered.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No expenses found.</td></tr>';
                return;
            }

            tbody.innerHTML = filtered.map(exp => `
                <tr>
                    <td>${formatDate(exp.createdAt)}</td>
                    <td>${exp.userName}</td>
                    <td>${exp.category}</td>
                    <td>$${exp.amount.toFixed(2)}</td>
                    <td>${exp.description || '-'}</td>
                    <td>
                        ${exp.invoiceUrl ? `
                            <a href="${getFullUrl(exp.invoiceUrl)}" target="_blank" class="btn btn-primary" style="padding: 4px 8px; font-size:12px;"><i class="fa-solid fa-image"></i> View</a>
                            <button onclick="window.forceDownload('${getFullUrl(exp.invoiceUrl)}', 'invoice_${exp.id}')" class="btn btn-outline" style="padding: 4px 8px; font-size:12px; margin-left: 4px;" title="Download"><i class="fa-solid fa-download"></i></button>
                        ` : '-'}
                    </td>
                    <td><span class="badge-status badge-${exp.status}">${exp.status.toUpperCase()}</span></td>
                    <td>
                        ${exp.status === 'pending' ? `
                            <button class="btn btn-success" onclick="window.updateExpense('${exp.id}', 'approved')"><i class="fa-solid fa-check"></i></button>
                            <button class="btn btn-danger" onclick="window.updateExpense('${exp.id}', 'rejected')"><i class="fa-solid fa-xmark"></i></button>
                        ` : '-'}
                    </td>
                </tr>
            `).join('');
        } catch (e) {
            tbody.innerHTML = '<tr><td colspan="8" class="error-text">Failed to load expenses</td></tr>';
        }
    }

    window.updateExpense = async (id, status) => {
        if (!confirm(`Are you sure you want to ${status} this expense?`)) return;
        try {
            await api.updateExpenseStatus(id, status);
            loadExpenses();
            loadDashboardData();
        } catch (e) {
            alert('Failed to update expense status: ' + e.message);
        }
    };

    // --- Documents ---
    window.switchDocTab = function(tab) {
        currentDocTab = tab;
        document.getElementById('btn-doc-emp').classList.toggle('active', tab === 'employees');
        document.getElementById('btn-doc-admin').classList.toggle('active', tab === 'admin');
        loadDocuments();
    };

    async function loadDocuments() {
        const tbody = document.querySelector('#documents-table tbody');
        tbody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';
        try {
            const docs = await api.getDocuments();
            const filtered = docs.filter(doc => 
                currentDocTab === 'employees' ? doc.uploaderId !== 'admin' : doc.uploaderId === 'admin'
            );

            if(filtered.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No documents found.</td></tr>';
                return;
            }

            tbody.innerHTML = filtered.map(doc => `
                <tr>
                    <td>${formatDate(doc.uploadedAt, true)}</td>
                    <td>${doc.title}</td>
                    <td>${doc.uploaderName}</td>
                    <td>${doc.targetType === 'ALL' ? 'All Employees' : doc.targetUserName || '-'}</td>
                    <td>${doc.fileType ? doc.fileType.toUpperCase() : 'UNKNOWN'}</td>
                    <td>
                        <a href="${getFullUrl(doc.filePath)}" target="_blank" class="btn btn-primary" style="padding: 4px 8px; font-size:12px;">Open</a>
                        <button onclick="window.forceDownload('${getFullUrl(doc.filePath)}', 'document_${doc.id}')" class="btn btn-outline" style="padding: 4px 8px; font-size:12px; margin-left: 4px;" title="Download"><i class="fa-solid fa-download"></i></button>
                    </td>
                </tr>
            `).join('');
        } catch (e) {
            tbody.innerHTML = '<tr><td colspan="6" class="error-text">Failed to load documents</td></tr>';
        }
    }

    document.getElementById('upload-doc-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('doc-title').value;
        const targetVal = document.getElementById('doc-target').value;
        const fileInput = document.getElementById('doc-file');

        if(fileInput.files.length === 0) return alert('Please select a file');
        const file = fileInput.files[0];

        const formData = new FormData();
        formData.append('title', title);
        formData.append('uploaderId', 'admin');
        formData.append('uploaderName', adminUser.name || 'Admin');
        
        if (targetVal === 'ALL') {
            formData.append('targetType', 'ALL');
        } else {
            formData.append('targetType', 'INDIVIDUAL');
            formData.append('targetUserId', targetVal);
            const empName = document.querySelector(`#doc-target option[value="${targetVal}"]`).textContent;
            formData.append('targetUserName', empName);
        }

        formData.append('file', file);

        try {
            const btn = document.getElementById('btn-upload-doc');
            btn.textContent = 'Uploading...';
            btn.disabled = true;
            await api.uploadDocument(formData);
            alert('Document uploaded successfully!');
            e.target.reset();
            if(currentDocTab === 'admin') loadDocuments();
        } catch(err) {
            alert('Upload failed: ' + err.message);
        } finally {
            const btn = document.getElementById('btn-upload-doc');
            btn.textContent = 'Upload Document';
            btn.disabled = false;
        }
    });

    // --- Media / Photos ---
    async function loadMedia() {
        const container = document.getElementById('media-grid-container');
        container.innerHTML = '<p>Loading photos...</p>';
        try {
            const mediaList = await api.getMedia();
            if(mediaList.length === 0) {
                container.innerHTML = '<p>No photos have been uploaded yet.</p>';
                return;
            }

            container.innerHTML = mediaList.map(m => `
                <div class="media-card">
                    <img src="${m.cloudinaryUrl || getFullUrl(m.filePath)}" alt="Upload">
                    <div class="media-card-body">
                        <div class="media-card-title" style="display:flex; justify-content:space-between; align-items:center;">
                            <span>${m.userName}</span>
                            <button onclick="window.downloadWithWatermark('${m.cloudinaryUrl || getFullUrl(m.filePath)}', 'geotagged_${m.id}.jpg', ['Uploaded by: ${m.userName}', 'Date: ${formatDate(m.timestamp, true)}', 'Location: ${m.address ? m.address.replace(/'/g, "\\'") : 'Unknown'}'])" class="btn btn-outline" style="padding: 4px 8px; font-size:12px;" title="Download with GPS Data"><i class="fa-solid fa-download"></i></button>
                        </div>
                        <div class="media-card-meta">
                            <i class="fa-solid fa-clock"></i> ${formatDate(m.timestamp, true)}<br>
                            <i class="fa-solid fa-location-dot"></i> ${m.address || 'Location unknown'}
                        </div>
                    </div>
                </div>
            `).join('');

        } catch (e) {
            container.innerHTML = '<p class="error-text">Failed to load media.</p>';
        }
    }


    // --- Geofence ---
    async function loadGeofence() {
        try {
            const res = await api.getGeofence();
            if (res) {
                document.getElementById('geo-lat').value = res.latitude;
                document.getElementById('geo-lng').value = res.longitude;
                document.getElementById('geo-rad').value = res.radius;
            }
        } catch(e) { console.error("Error loading geofence", e); }
    }

    document.getElementById('geofence-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            latitude: parseFloat(document.getElementById('geo-lat').value),
            longitude: parseFloat(document.getElementById('geo-lng').value),
            radius: parseFloat(document.getElementById('geo-rad').value)
        };
        try {
            await api.updateGeofence(payload);
            const msg = document.getElementById('geo-msg');
            msg.classList.remove('hidden');
            setTimeout(() => msg.classList.add('hidden'), 3000);
        } catch(e) {
            alert('Failed to update: ' + e.message);
        }
    });

    // Auto-Location Button
    document.getElementById('btn-get-location').addEventListener('click', () => {
        if (navigator.geolocation) {
            const btn = document.getElementById('btn-get-location');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Locating...';
            
            navigator.geolocation.getCurrentPosition((position) => {
                document.getElementById('geo-lat').value = position.coords.latitude;
                document.getElementById('geo-lng').value = position.coords.longitude;
                btn.innerHTML = originalText;
            }, (error) => {
                btn.innerHTML = originalText;
                alert('Geolocation failed: ' + error.message);
            });
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    });

    // --- Live Tracking Map ---
    let liveLayerGroup = null;
    function initLiveMap() {
        if (!liveMap) {
            liveMap = L.map('live-map').setView([28.6692, 77.4538], 12);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(liveMap);
            liveLayerGroup = L.layerGroup().addTo(liveMap);
        }
        setTimeout(() => { liveMap.invalidateSize(); fetchLiveTracking(); }, 200);
    }

    document.getElementById('btn-refresh-live').addEventListener('click', fetchLiveTracking);

    async function fetchLiveTracking() {
        const empId = document.getElementById('live-emp-select').value;
        const targetUserId = empId === 'all' ? null : empId;
        liveLayerGroup.clearLayers();
        try {
            const footprints = await api.getFootprints(targetUserId);
            // Group by userId and get latest
            const latestFootprints = {};
            footprints.forEach(f => {
                if (!latestFootprints[f.userId] || Number(f.timestamp) > Number(latestFootprints[f.userId].timestamp)) {
                    latestFootprints[f.userId] = f;
                }
            });

            let bounds = L.latLngBounds();
            Object.values(latestFootprints).forEach(f => {
                if(f.latitude && f.longitude) {
                    const emp = allEmployees.find(e => e.id === f.userId);
                    const name = emp ? emp.name : f.userId;
                    const batInfo = f.batteryLevel !== null ? `${Math.round(f.batteryLevel*100)}%` : 'Unknown';
                    const addressInfo = f.address || 'Address Unknown';
                    
                    const marker = L.marker([f.latitude, f.longitude])
                        .bindPopup(`<b>${name}</b><br>
                                    Last seen: ${formatDate(f.timestamp, true)}<br>
                                    🔋 Battery: ${batInfo}<br>
                                    📍 Address: ${addressInfo}`)
                        .addTo(liveLayerGroup);
                    bounds.extend(marker.getLatLng());
                }
            });
            if(Object.values(latestFootprints).length > 0) {
                liveMap.fitBounds(bounds, { padding: [50, 50] });
            }
        } catch(e) {
            console.error("Live track error", e);
        }
    }

    // --- Route Replay Map ---
    let replayLayerGroup = null;
    function initReplayMap() {
        if (!replayMap) {
            replayMap = L.map('replay-map').setView([28.6692, 77.4538], 12);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(replayMap);
            replayLayerGroup = L.layerGroup().addTo(replayMap);
        }
        setTimeout(() => replayMap.invalidateSize(), 200);
    }

    document.getElementById('btn-load-route').addEventListener('click', async () => {
        const empId = document.getElementById('replay-emp-select').value;
        const dateVal = document.getElementById('replay-date').value;
        if(!empId || !dateVal) return alert("Select an employee and a date.");
        
        replayLayerGroup.clearLayers();
        try {
            const footprints = await api.getFootprints(empId);
            // Filter by date
            const dateObj = new Date(dateVal);
            const targetDateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth()+1).padStart(2,'0')}-${String(dateObj.getDate()).padStart(2,'0')}`;
            
            const dayFootprints = footprints.filter(f => {
                const fd = new Date(Number(f.timestamp));
                const fdStr = `${fd.getFullYear()}-${String(fd.getMonth()+1).padStart(2,'0')}-${String(fd.getDate()).padStart(2,'0')}`;
                return fdStr === targetDateStr && f.latitude && f.longitude;
            }).sort((a,b) => Number(a.timestamp) - Number(b.timestamp));

            if(dayFootprints.length === 0) {
                return alert("No location data found for this employee on this date.");
            }

            const latlngs = dayFootprints.map(f => [f.latitude, f.longitude]);
            const polyline = L.polyline(latlngs, { color: 'blue', weight: 4 }).addTo(replayLayerGroup);
            
            // Add markers for ALL footprints
            dayFootprints.forEach((f, index) => {
                const isStart = index === 0;
                const isEnd = index === dayFootprints.length - 1;
                
                const methodLabel = f.trackingMethod === 'CELLULAR' ? '📱 Cellular' : '🛰️ GPS';
                const color = f.trackingMethod === 'CELLULAR' ? '#f59e0b' : '#2563eb';
                const addr = f.address ? `<br><small style="color: #64748b;">${f.address}</small>` : '';
                const popupContent = `<b>Footprint ${index + 1} (${methodLabel})</b><br>${formatDate(f.timestamp, true)}<br>Battery: ${f.batteryLevel ? Math.round(f.batteryLevel*100) + '%' : 'N/A'}${addr}`;

                if (isStart) {
                    L.marker([f.latitude, f.longitude]).bindPopup(`<b>Start</b><br>${popupContent}`).addTo(replayLayerGroup);
                } else if (isEnd) {
                    L.marker([f.latitude, f.longitude]).bindPopup(`<b>End/Current</b><br>${popupContent}`).addTo(replayLayerGroup);
                } else {
                    // Use a small circle marker for intermediate footprints to avoid cluttering
                    L.circleMarker([f.latitude, f.longitude], {
                        radius: 5,
                        color: color,
                        fillColor: '#ffffff',
                        fillOpacity: 1,
                        weight: 2
                    }).bindPopup(popupContent).addTo(replayLayerGroup);
                }
            });

            replayMap.fitBounds(polyline.getBounds(), { padding: [50, 50] });

        } catch(e) {
            console.error("Replay error", e);
        }
    });

    let trackingMap;
    let trackingPolyline;
    let trackingMarkers = [];

    window.loadEmployeeTracking = function(userId, userName) {
        document.getElementById('tracking-emp-name').innerText = userName + ' - Tracking';
        
        // Hide all views and show tracking
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active', 'hidden'));
        document.querySelectorAll('.view').forEach(v => {
            if(v.id !== 'employee-tracking-view') v.classList.add('hidden');
        });
        document.getElementById('employee-tracking-view').classList.remove('hidden');
        
        // Initialize map if needed
        if (!trackingMap) {
            trackingMap = L.map('tracking-map').setView([28.6692, 77.4538], 10);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap &copy; CARTO'
            }).addTo(trackingMap);
        }

        const datePicker = document.getElementById('tracking-date-picker');
        if (!datePicker.value) {
            datePicker.value = new Date().toISOString().split('T')[0];
        }

        const fetchTrackingData = async () => {
            try {
                const date = datePicker.value;
                const footprints = await api.getFootprintHistory(userId, date);
                
                // Process battery & temp from latest footprint
                if (footprints && footprints.length > 0) {
                    const latest = footprints[footprints.length - 1];
                    document.getElementById('tracking-battery').innerText = latest.batteryLevel ? Math.round(latest.batteryLevel * 100) + '%' : 'N/A';
                    document.getElementById('tracking-temp').innerText = latest.batteryTemp ? latest.batteryTemp + '°C' : 'N/A';
                } else {
                    document.getElementById('tracking-battery').innerText = 'N/A';
                    document.getElementById('tracking-temp').innerText = 'N/A';
                }

                // Calculate GPS off duration
                let gpsOffMinutes = 0;
                let lastOffTime = null;

                for (let i = 0; i < footprints.length; i++) {
                    const f = footprints[i];
                    if (f.locationEnabled === false || f.locationEnabled === 0) {
                        if (!lastOffTime) lastOffTime = parseInt(f.timestamp);
                    } else {
                        if (lastOffTime) {
                            gpsOffMinutes += (parseInt(f.timestamp) - lastOffTime) / 60000;
                            lastOffTime = null;
                        }
                    }
                }
                
                // If it ended while off
                if (lastOffTime) {
                   const endOfDayTime = new Date(date + 'T23:59:59').getTime();
                   const nowTime = new Date().getTime();
                   const capTime = Math.min(endOfDayTime, nowTime);
                   gpsOffMinutes += (capTime - lastOffTime) / 60000;
                }
                
                if (gpsOffMinutes > 0) {
                    const hrs = Math.floor(gpsOffMinutes / 60);
                    const mins = Math.floor(gpsOffMinutes % 60);
                    document.getElementById('tracking-gps-off').innerText = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
                } else {
                    document.getElementById('tracking-gps-off').innerText = '0m';
                }

                // Plot on map
                if (trackingPolyline) trackingMap.removeLayer(trackingPolyline);
                trackingMarkers.forEach(m => trackingMap.removeLayer(m));
                trackingMarkers = [];

                const latlngs = footprints
                    .filter(f => f.latitude && f.longitude)
                    .map(f => [f.latitude, f.longitude]);

                if (latlngs.length > 0) {
                    trackingPolyline = L.polyline(latlngs, {color: '#2563eb', weight: 4}).addTo(trackingMap);
                    trackingMap.fitBounds(trackingPolyline.getBounds(), { padding: [50, 50] });
                    
                    // Add markers for ALL footprints
                    const validFootprints = footprints.filter(f => f.latitude && f.longitude);
                    validFootprints.forEach((f, index) => {
                        const isStart = index === 0;
                        const isEnd = index === validFootprints.length - 1;
                        
                        const methodLabel = f.trackingMethod === 'CELLULAR' ? '📱 Cellular' : '🛰️ GPS';
                        const color = f.trackingMethod === 'CELLULAR' ? '#f59e0b' : '#2563eb'; // Orange for cellular, Blue for GPS
                        const addr = f.address ? `<br><small style="color: #64748b;">${f.address}</small>` : '';
                        const popupContent = `<b>Footprint ${index + 1} (${methodLabel})</b><br>${formatDate(f.timestamp, true)}<br>Battery: ${f.batteryLevel ? Math.round(f.batteryLevel*100) + '%' : 'N/A'}${addr}`;
                        
                        let m;
                        if (isStart) {
                            m = L.marker([f.latitude, f.longitude]).bindPopup(`<b>Start</b><br>${popupContent}`);
                        } else if (isEnd) {
                            m = L.marker([f.latitude, f.longitude]).bindPopup(`<b>End/Current</b><br>${popupContent}`);
                        } else {
                            m = L.circleMarker([f.latitude, f.longitude], {
                                radius: 5, color: color, fillColor: '#fff', fillOpacity: 1, weight: 2
                            }).bindPopup(popupContent);
                        }
                        m.addTo(trackingMap);
                        trackingMarkers.push(m);
                    });
                }
            } catch (e) {
                console.error(e);
            }
        };

        // Assign fetch function to date picker change
        datePicker.onchange = fetchTrackingData;
        fetchTrackingData();
        
        // Fix map size after display change
        setTimeout(() => trackingMap.invalidateSize(), 300);
    };

    document.getElementById('btn-back-employees').addEventListener('click', () => {
        window.navigateTo('employees-view');
    });

    init();
});

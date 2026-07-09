// ==========================================
// SentiSpam AI Frontend Client Application
// ==========================================

const API_BASE = "/api";

// App State
let state = {
    user: null,
    token: null,
    currentTab: "tab-checker",
    history: {
        page: 1,
        limit: 10,
        totalPages: 1,
        search: "",
        prediction: "all"
    },
    selectedFile: null,
    bulkResults: []
};

// ==========================================
// App Initialization
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // Check local storage for existing session
    checkAuthOnLoad();
    
    // Set current date in header
    const dateBadge = document.getElementById("current-date-badge");
    if (dateBadge) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        dateBadge.textContent = new Date().toLocaleDateString('en-US', options);
    }

    // Set up drag and drop listeners
    setupDragAndDrop();
});

// Drag and drop setup
function setupDragAndDrop() {
    const dropZone = document.getElementById("drop-zone");
    if (!dropZone) return;

    ["dragenter", "dragover"].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.style.borderColor = "var(--accent-secondary)";
            dropZone.style.background = "rgba(139, 92, 246, 0.05)";
        }, false);
    });

    ["dragleave", "drop"].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.style.borderColor = "rgba(255, 255, 255, 0.15)";
            dropZone.style.background = "rgba(0, 0, 0, 0.15)";
        }, false);
    });

    dropZone.addEventListener("drop", (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            handleSelectedFile(files[0]);
        }
    });
}

// ==========================================
// Toast Notifications
// ==========================================
function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    let icon = "fa-circle-info";
    if (type === "success") icon = "fa-circle-check";
    if (type === "error") icon = "fa-circle-exclamation";
    if (type === "warning") icon = "fa-triangle-exclamation";

    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Auto-remove toast after 4 seconds
    setTimeout(() => {
        toast.style.animation = "slideIn 0.3s ease reverse forwards";
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==========================================
// View & Tab Switching
// ==========================================
function showView(viewId) {
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    document.getElementById(viewId).classList.add("active");
}

function switchTab(tabId) {
    state.currentTab = tabId;
    
    // Toggle active sidebar links
    document.querySelectorAll(".sidebar-nav .nav-item").forEach(item => {
        item.classList.remove("active");
    });
    
    // Find active element based on click target
    const clickedItem = Array.from(document.querySelectorAll(".sidebar-nav .nav-item")).find(item => {
        return item.getAttribute("onclick").includes(tabId);
    });
    if (clickedItem) clickedItem.classList.add("active");

    // Toggle active tab content
    document.querySelectorAll(".dashboard-tab").forEach(tab => {
        tab.classList.remove("active");
    });
    document.getElementById(tabId).classList.add("active");

    // Update Header title
    const titles = {
        "tab-checker": "Spam Checker",
        "tab-bulk": "Bulk Upload Scanner",
        "tab-history": "Scan History Logs",
        "tab-settings": "Account Settings",
        "tab-admin": "Admin Intelligence Panel"
    };
    document.getElementById("tab-title").textContent = titles[tabId] || "Dashboard";

    // Trigger tab-specific fetches
    if (tabId === "tab-history") {
        state.history.page = 1;
        fetchHistory();
    } else if (tabId === "tab-settings") {
        loadProfileSettings();
    } else if (tabId === "tab-admin") {
        fetchAdminDashboard();
    }
}

// Scroll landing page
function scrollToFeatures() {
    document.getElementById("features").scrollIntoView({ behavior: "smooth" });
}

// ==========================================
// Auth Modals
// ==========================================
function showAuthModal(type = "login") {
    const modal = document.getElementById("auth-modal");
    modal.classList.add("active");
    toggleAuthForm(type);
}

function closeAuthModal() {
    document.getElementById("auth-modal").classList.remove("active");
    // Clear forms
    document.getElementById("login-form").reset();
    document.getElementById("register-form").reset();
}

function toggleAuthForm(type) {
    const loginCont = document.getElementById("auth-login-container");
    const regCont = document.getElementById("auth-register-container");
    
    if (type === "login") {
        loginCont.classList.remove("hidden");
        regCont.classList.add("hidden");
    } else {
        loginCont.classList.add("hidden");
        regCont.classList.remove("hidden");
    }
}

// ==========================================
// Authentication Operations
// ==========================================
function checkAuthOnLoad() {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    
    if (storedToken && storedUser) {
        state.token = storedToken;
        state.user = JSON.parse(storedUser);
        setupUserSession();
        showView("view-dashboard");
        switchTab("tab-checker");
    } else {
        showView("view-landing");
    }
}

function setupUserSession() {
    // Populate user details in sidebar
    document.getElementById("user-display-name").textContent = state.user.name;
    document.getElementById("user-display-role").textContent = state.user.role;

    // Toggle admin link in sidebar
    const adminLink = document.getElementById("sidebar-admin-link");
    if (state.user.role === "admin") {
        adminLink.classList.remove("hidden");
    } else {
        adminLink.classList.add("hidden");
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById("register-name").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;

    try {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.message || "Registration failed");
        }

        // Store session
        state.token = data.token;
        state.user = data.user;
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        showToast("Registration successful! Welcome.", "success");
        closeAuthModal();
        setupUserSession();
        showView("view-dashboard");
        switchTab("tab-checker");

    } catch (err) {
        showToast(err.message, "error");
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.message || "Login failed");
        }

        // Store session
        state.token = data.token;
        state.user = data.user;
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        showToast("Login successful!", "success");
        closeAuthModal();
        setupUserSession();
        showView("view-dashboard");
        switchTab("tab-checker");

    } catch (err) {
        showToast(err.message, "error");
    }
}

function handleLogout() {
    state.token = null;
    state.user = null;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    showToast("Logged out successfully.", "info");
    showView("view-landing");
}

// ==========================================
// Spam Checker Operation
// ==========================================
async function handleSinglePredict(e) {
    e.preventDefault();
    const subject = document.getElementById("email-subject").value;
    const content = document.getElementById("email-content").value;

    if (!content || !content.trim()) {
        showToast("Email content cannot be empty!", "warning");
        return;
    }

    // Toggle states
    const placeholder = document.getElementById("checker-result-placeholder");
    const display = document.getElementById("checker-result-display");
    
    placeholder.innerHTML = `<i class="fa-solid fa-spinner placeholder-icon fa-spin"></i><p>Analyzing email context...</p>`;
    placeholder.classList.remove("hidden");
    display.classList.add("hidden");

    try {
        const res = await fetch(`${API_BASE}/spam/predict-text`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${state.token}`
            },
            body: JSON.stringify({ subject, content })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Prediction failed");
        }

        const predictionInfo = data.data;

        // Hide placeholder and show display
        placeholder.classList.add("hidden");
        display.classList.remove("hidden");

        // Set layout styling based on spam vs ham
        display.className = "result-display"; // reset
        const badge = document.getElementById("result-badge");
        const fallbackBadge = document.getElementById("fallback-badge");
        
        if (predictionInfo.prediction === "spam") {
            display.classList.add("spam-active");
            badge.textContent = "SPAM";
            badge.className = "badge badge-spam";
            
            document.getElementById("rec-title").textContent = "High Risk Detected";
            document.getElementById("rec-desc").textContent = "This text matches known spam templates. Avoid replying or sharing bank/credentials details.";
            document.querySelector(".recommendation-card").className = "recommendation-card spam-advice";
        } else {
            display.classList.add("ham-active");
            badge.textContent = "HAM (SAFE)";
            badge.className = "badge badge-ham";
            
            document.getElementById("rec-title").textContent = "Inbox Safe";
            document.getElementById("rec-desc").textContent = "No standard spam signals detected. It appears safe to read and reply.";
            document.querySelector(".recommendation-card").className = "recommendation-card";
        }

        // Regex fallback indicator
        if (predictionInfo.isFallback) {
            fallbackBadge.classList.remove("hidden");
        } else {
            fallbackBadge.classList.add("hidden");
        }

        // Probability meter
        const percentage = Math.round(predictionInfo.probability * 100);
        document.getElementById("result-probability").textContent = `${percentage}%`;
        document.getElementById("result-meter").style.width = `${percentage}%`;

        // Keywords list
        const keywordsContainer = document.getElementById("result-keywords");
        keywordsContainer.innerHTML = "";
        
        if (predictionInfo.isFallback) {
            // Heuristic triggers
            const lowerContent = content.toLowerCase();
            const triggers = ["free", "win", "lottery", "crypto", "bitcoin", "money", "urgent", "action", "verify", "password", "bank", "click here"];
            const matched = triggers.filter(tr => lowerContent.includes(tr));
            
            if (matched.length > 0) {
                matched.forEach(kw => {
                    const pill = document.createElement("span");
                    pill.className = "keyword-pill";
                    pill.textContent = kw;
                    keywordsContainer.appendChild(pill);
                });
            } else {
                keywordsContainer.innerHTML = `<span class="keywords-note">No standard keywords flagged. Checked via basic ruleset.</span>`;
            }
        } else {
            // ML server features
            if (predictionInfo.keywords && predictionInfo.keywords.length > 0) {
                predictionInfo.keywords.forEach(word => {
                    const pill = document.createElement("span");
                    pill.className = "keyword-pill";
                    pill.textContent = word;
                    keywordsContainer.appendChild(pill);
                });
            } else {
                keywordsContainer.innerHTML = `<span class="keywords-note">No strong keyword indicators. Checked via contextual weights.</span>`;
            }
        }

    } catch (err) {
        showToast(err.message, "error");
        // Reset placeholder
        placeholder.innerHTML = `<i class="fa-solid fa-triangle-exclamation placeholder-icon text-spam"></i><p>Error processing request.</p>`;
        placeholder.classList.remove("hidden");
        display.classList.add("hidden");
    }
}

function clearChecker() {
    document.getElementById("checker-form").reset();
    document.getElementById("checker-result-placeholder").classList.remove("hidden");
    document.getElementById("checker-result-placeholder").innerHTML = `
        <i class="fa-solid fa-chart-simple placeholder-icon"></i>
        <p>Submit an email to view real-time spam prediction metrics.</p>
    `;
    document.getElementById("checker-result-display").classList.add("hidden");
}

// ==========================================
// Bulk upload operations
// ==========================================
function triggerFileSelect() {
    document.getElementById("bulk-file-input").click();
}

function handleFileChange(e) {
    if (e.target.files.length > 0) {
        handleSelectedFile(e.target.files[0]);
    }
}

function handleSelectedFile(file) {
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext !== "csv" && ext !== "txt") {
        showToast("Unsupported file type! Only .csv and .txt allowed.", "error");
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        showToast("File size exceeds 10MB limit!", "error");
        return;
    }

    state.selectedFile = file;

    // Display file card
    document.getElementById("selected-file-name").textContent = file.name;
    document.getElementById("selected-file-size").textContent = `${(file.size / 1024).toFixed(1)} KB`;
    document.getElementById("selected-file-card").classList.remove("hidden");
    
    // Enable button
    document.getElementById("btn-process-bulk").removeAttribute("disabled");
}

function removeSelectedFile() {
    state.selectedFile = null;
    document.getElementById("bulk-file-input").value = "";
    document.getElementById("selected-file-card").classList.add("hidden");
    document.getElementById("btn-process-bulk").setAttribute("disabled", "true");
}

async function uploadAndProcessFile() {
    if (!state.selectedFile) return;

    const btn = document.getElementById("btn-process-bulk");
    btn.setAttribute("disabled", "true");
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing File...`;

    const formData = new FormData();
    formData.append("file", state.selectedFile);

    try {
        const res = await fetch(`${API_BASE}/spam/predict-file`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${state.token}`
            },
            body: formData
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Failed to process bulk upload");
        }

        showToast(`Bulk file processed: ${data.totalScanned} emails scanned.`, "success");

        // Display results
        state.bulkResults = data.results;
        document.getElementById("bulk-stat-total").textContent = data.totalScanned;
        document.getElementById("bulk-stat-spam").textContent = data.spamCount;
        document.getElementById("bulk-stat-ham").textContent = data.hamCount;

        // Render table
        const tbody = document.querySelector("#bulk-results-table tbody");
        tbody.innerHTML = "";

        data.results.forEach((row, index) => {
            const tr = document.createElement("tr");
            const badgeClass = row.prediction === "spam" ? "badge-spam" : "badge-ham";
            const badgeText = row.prediction === "spam" ? "SPAM" : "HAM";
            const probPct = Math.round(row.probability * 100);

            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${escapeHtml(row.subject)}</td>
                <td><span class="text-preview">${escapeHtml(row.content)}</span></td>
                <td><span class="badge ${badgeClass}">${badgeText}</span></td>
                <td>${probPct}%</td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById("bulk-results-card").classList.remove("hidden");
        removeSelectedFile();

    } catch (err) {
        showToast(err.message, "error");
    } finally {
        btn.removeAttribute("disabled");
        btn.innerHTML = `<i class="fa-solid fa-gears"></i> Process Bulk List`;
    }
}

function exportBulkResults() {
    if (state.bulkResults.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Subject,Email Content,Prediction,Probability\n";

    state.bulkResults.forEach((row, index) => {
        const safeSubject = `"${row.subject.replace(/"/g, '""')}"`;
        const safeContent = `"${row.content.replace(/"/g, '""')}"`;
        csvContent += `${index + 1},${safeSubject},${safeContent},${row.prediction},${row.probability}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bulk_prediction_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ==========================================
// Scan History Log operations
// ==========================================
let historyTimeout = null;
function debounceHistorySearch() {
    clearTimeout(historyTimeout);
    historyTimeout = setTimeout(() => {
        state.history.page = 1;
        fetchHistory();
    }, 500);
}

async function fetchHistory() {
    const search = document.getElementById("history-search").value;
    const filter = document.getElementById("history-filter-pred").value;
    
    state.history.search = search;
    state.history.prediction = filter;

    let url = `${API_BASE}/spam/history?page=${state.history.page}&limit=${state.history.limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (filter !== "all") url += `&prediction=${filter}`;

    try {
        const res = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${state.token}`
            }
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Failed to fetch scan history");
        }

        state.history.totalPages = data.totalPages || 1;

        // Render table
        const tbody = document.getElementById("history-table-body");
        tbody.innerHTML = "";

        if (data.history.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--color-text-muted);">No scan logs found. Try adjusting filters or running new scans.</td></tr>`;
            document.getElementById("btn-history-prev").setAttribute("disabled", "true");
            document.getElementById("btn-history-next").setAttribute("disabled", "true");
            document.getElementById("history-page-info").textContent = "Page 1 of 1";
            return;
        }

        data.history.forEach(row => {
            const tr = document.createElement("tr");
            const badgeClass = row.prediction === "spam" ? "badge-spam" : "badge-ham";
            const badgeText = row.prediction === "spam" ? "SPAM" : "HAM";
            const probPct = Math.round(row.probability * 100);
            
            // Format date
            const date = new Date(row.createdAt);
            const dateStr = date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const methodIcon = row.method === "file" ? '<i class="fa-solid fa-file-csv" title="Uploaded File"></i> File' : '<i class="fa-solid fa-pen-clip" title="Text Input"></i> Text';

            tr.innerHTML = `
                <td>${dateStr}</td>
                <td>${methodIcon}</td>
                <td>${escapeHtml(row.subject)}</td>
                <td><span class="text-preview">${escapeHtml(row.content)}</span></td>
                <td><span class="badge ${badgeClass}">${badgeText}</span></td>
                <td>${probPct}%</td>
                <td>
                    <button class="btn-delete-row" onclick="deleteHistoryItem('${row._id}')">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Pagination controls
        document.getElementById("history-page-info").textContent = `Page ${state.history.page} of ${state.history.totalPages}`;
        
        if (state.history.page > 1) {
            document.getElementById("btn-history-prev").removeAttribute("disabled");
        } else {
            document.getElementById("btn-history-prev").setAttribute("disabled", "true");
        }

        if (state.history.page < state.history.totalPages) {
            document.getElementById("btn-history-next").removeAttribute("disabled");
        } else {
            document.getElementById("btn-history-next").setAttribute("disabled", "true");
        }

    } catch (err) {
        showToast(err.message, "error");
    }
}

function changeHistoryPage(delta) {
    const targetPage = state.history.page + delta;
    if (targetPage >= 1 && targetPage <= state.history.totalPages) {
        state.history.page = targetPage;
        fetchHistory();
    }
}

async function deleteHistoryItem(id) {
    if (!confirm("Are you sure you want to delete this scan history entry?")) return;

    try {
        const res = await fetch(`${API_BASE}/spam/history/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${state.token}`
            }
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Failed to delete item");
        }

        showToast("Log entry deleted successfully.", "success");
        
        // Re-fetch current page (or previous if page became empty)
        if (document.querySelectorAll("#history-table-body tr").length === 1 && state.history.page > 1) {
            state.history.page--;
        }
        fetchHistory();

    } catch (err) {
        showToast(err.message, "error");
    }
}

// ==========================================
// Settings Operations
// ==========================================
function loadProfileSettings() {
    document.getElementById("settings-name").value = state.user.name;
    document.getElementById("settings-email").value = state.user.email;
}

async function handleUpdateProfile(e) {
    e.preventDefault();
    const name = document.getElementById("settings-name").value;
    const email = document.getElementById("settings-email").value;

    try {
        const res = await fetch(`${API_BASE}/auth/profile`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${state.token}`
            },
            body: JSON.stringify({ name, email })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Failed to update profile");
        }

        // Update local session cache
        state.user = data.user;
        localStorage.setItem("user", JSON.stringify(data.user));
        setupUserSession();

        showToast("Profile updated successfully!", "success");

    } catch (err) {
        showToast(err.message, "error");
    }
}

async function handleChangePassword(e) {
    e.preventDefault();
    const currentPassword = document.getElementById("settings-curr-pass").value;
    const newPassword = document.getElementById("settings-new-pass").value;

    if (newPassword.length < 6) {
        showToast("New password must be at least 6 characters!", "warning");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/auth/change-password`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${state.token}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Failed to change password");
        }

        showToast("Password updated successfully!", "success");
        document.getElementById("settings-password-form").reset();

    } catch (err) {
        showToast(err.message, "error");
    }
}

// ==========================================
// Admin Panel Operations
// ==========================================
async function fetchAdminDashboard() {
    try {
        // Fetch stats
        const statsRes = await fetch(`${API_BASE}/admin/stats`, {
            headers: { "Authorization": `Bearer ${state.token}` }
        });
        const statsData = await statsRes.json();
        
        if (!statsRes.ok) throw new Error(statsData.message);

        // Populate card panels
        document.getElementById("admin-stat-users").textContent = statsData.stats.totalUsers;
        document.getElementById("admin-stat-scans").textContent = statsData.stats.totalScans;
        document.getElementById("admin-stat-spam").textContent = statsData.stats.spamCount;
        document.getElementById("admin-stat-spam-rate").textContent = `${statsData.stats.spamRate}%`;

        // Fetch users accounts
        const usersRes = await fetch(`${API_BASE}/admin/users`, {
            headers: { "Authorization": `Bearer ${state.token}` }
        });
        const usersData = await usersRes.json();

        if (!usersRes.ok) throw new Error(usersData.message);

        const tbody = document.querySelector("#admin-users-table tbody");
        tbody.innerHTML = "";

        usersData.users.forEach(user => {
            const tr = document.createElement("tr");
            
            // Check roles
            const isSelf = user.id === state.user.id || user._id === state.user.id;
            const roleActionBtnText = user.role === "admin" ? "Demote" : "Promote";
            const roleActionBtnClass = user.role === "admin" ? "btn-secondary" : "btn-primary";
            const targetRole = user.role === "admin" ? "user" : "admin";

            tr.innerHTML = `
                <td>${escapeHtml(user.name)} ${isSelf ? '<span class="badge badge-warning">Self</span>' : ''}</td>
                <td>${escapeHtml(user.email)}</td>
                <td><span class="badge ${user.role === 'admin' ? 'badge-spam' : 'badge-ham'}">${user.role.toUpperCase()}</span></td>
                <td>
                    <button class="btn ${roleActionBtnClass} btn-sm" onclick="changeUserRole('${user._id || user.id}', '${targetRole}')" ${isSelf ? 'disabled' : ''}>
                        ${roleActionBtnText}
                    </button>
                    <button class="btn-delete-row" style="margin-left: 8px;" onclick="deleteUserAccount('${user._id || user.id}')" ${isSelf ? 'disabled' : ''}>
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Load ML status
        fetchMLStatus();

    } catch (err) {
        showToast(err.message, "error");
    }
}

async function fetchMLStatus() {
    try {
        const res = await fetch(`${API_BASE}/admin/ml-status`, {
            headers: { "Authorization": `Bearer ${state.token}` }
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        const statusBadge = document.getElementById("admin-ml-service-status");
        
        if (data.status === "online") {
            statusBadge.textContent = "Online";
            statusBadge.className = "status-badge status-online";
            
            const metrics = data.modelInfo.metrics;
            if (metrics) {
                document.getElementById("admin-ml-val-accuracy").textContent = `${Math.round(metrics.accuracy * 100)}%`;
                document.getElementById("admin-ml-val-precision").textContent = `${Math.round(metrics.spam_precision * 100)}%`;
                document.getElementById("admin-ml-val-recall").textContent = `${Math.round(metrics.spam_recall * 100)}%`;
                document.getElementById("admin-ml-val-dataset").textContent = `${metrics.dataset_size} items`;
                document.getElementById("admin-ml-val-trained-at").textContent = metrics.trained_at;
            }
        } else {
            statusBadge.textContent = "Offline (Rule-based Fallback)";
            statusBadge.className = "status-badge status-offline";
            
            document.getElementById("admin-ml-val-accuracy").textContent = "N/A";
            document.getElementById("admin-ml-val-precision").textContent = "N/A";
            document.getElementById("admin-ml-val-recall").textContent = "N/A";
            document.getElementById("admin-ml-val-dataset").textContent = "N/A";
            document.getElementById("admin-ml-val-trained-at").textContent = "N/A";
        }

    } catch (err) {
        showToast(err.message, "error");
    }
}

async function triggerMLRetraining() {
    const btn = document.getElementById("btn-retrain-ml");
    btn.setAttribute("disabled", "true");
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Rebuilding model...`;

    try {
        const res = await fetch(`${API_BASE}/admin/ml-retrain`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${state.token}` }
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        showToast("Model retrained and reloaded successfully!", "success");
        fetchMLStatus();

    } catch (err) {
        showToast(err.message, "error");
    } finally {
        btn.removeAttribute("disabled");
        btn.innerHTML = `<i class="fa-solid fa-rotate"></i> Retrain Model Now`;
    }
}

async function changeUserRole(userId, newRole) {
    try {
        const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${state.token}`
            },
            body: JSON.stringify({ role: newRole })
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        showToast("User role updated successfully.", "success");
        fetchAdminDashboard();

    } catch (err) {
        showToast(err.message, "error");
    }
}

async function deleteUserAccount(userId) {
    if (!confirm("Are you sure you want to delete this user? Their entire search and scanning history will be wiped.")) return;

    try {
        const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${state.token}` }
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        showToast("User account deleted successfully.", "success");
        fetchAdminDashboard();

    } catch (err) {
        showToast(err.message, "error");
    }
}

// ==========================================
// Helper functions
// ==========================================
function escapeHtml(string) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(string).replace(/[&<>"']/g, function(m) { return map[m]; });
}

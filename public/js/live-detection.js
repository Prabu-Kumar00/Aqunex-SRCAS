document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on the live detection page
    const root = document.querySelector('.live-root');
    if (!root) return;

    const statusDot = document.getElementById('live-status-dot');
    const statusText = document.getElementById('live-status-text');
    const mainImage = document.getElementById('live-main-image');
    const metaClasses = document.getElementById('meta-classes');
    const metaConfidence = document.getElementById('meta-confidence');
    const metaDevice = document.getElementById('meta-device');
    const metaTimestamp = document.getElementById('meta-timestamp');
    const galleryGrid = document.getElementById('live-gallery-grid');
    const galleryCount = document.getElementById('gallery-count');
    const placeholder = document.getElementById('live-main-placeholder');
    const contentWrapper = document.getElementById('live-content-wrapper');

    let currentLatestId = window.INITIAL_DETECTION_ID || null;
    let isOffline = false;

    function setStatus(live) {
        if (live) {
            if (isOffline) {
                if (statusDot) statusDot.className = 'status-dot status-dot--connected';
                if (statusText) statusText.textContent = 'Live';
                isOffline = false;
            }
        } else {
            if (!isOffline) {
                if (statusDot) statusDot.className = 'status-dot status-dot--disconnected';
                if (statusText) statusText.textContent = 'Offline';
                isOffline = true;
            }
        }
    }

    function parseDate(ts) {
        if (!ts) return "N/A";
        try {
            if (typeof ts === 'object' && ts._seconds) return new Date(ts._seconds * 1000);
            const d = new Date(ts);
            return isNaN(d.getTime()) ? null : d;
        } catch(e) { return null; }
    }

    function escapeHtml(unsafe) {
        return (unsafe || '').toString()
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    function updateMainFrame(imgBase64, classesStr, confStr, deviceStr, timeStr) {
        if (mainImage) mainImage.src = `data:image/jpeg;base64,${escapeHtml(imgBase64)}`;
        if (metaClasses) metaClasses.textContent = classesStr;
        if (metaConfidence) metaConfidence.textContent = confStr;
        if (metaDevice) metaDevice.textContent = deviceStr;
        if (metaTimestamp) metaTimestamp.textContent = timeStr;
    }

    // Handle gallery clicks using event delegation
    if (galleryGrid) {
        galleryGrid.addEventListener('click', (e) => {
            const item = e.target.closest('.gallery-item');
            if (!item) return;

            const img = item.getAttribute('data-img');
            const cls = item.getAttribute('data-classes');
            const conf = item.getAttribute('data-conf');
            const dev = item.getAttribute('data-device');
            const time = item.getAttribute('data-time');

            updateMainFrame(img, cls, conf, dev, time);
        });
    }

    async function pollLatestDetection() {
        try {
            const res = await fetch('/api/detections/latest');
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            
            const data = await res.json();
            setStatus(true);

            if (data.detections && data.detections.length > 0) {
                const latest = data.detections[0];
                
                // If it's a new detection
                if (latest.id !== currentLatestId) {
                    currentLatestId = latest.id;

                    // Hide placeholder, show content wrapper
                    if (placeholder && placeholder.style.display !== 'none') {
                        placeholder.style.display = 'none';
                        if (contentWrapper) {
                            contentWrapper.style.display = ''; 
                            // Add grid class if it wasn't there or let css handle it
                        }
                    }

                    const maxConf = (latest.confidences && latest.confidences.length > 0) 
                        ? Math.max(...latest.confidences).toFixed(2) 
                        : 'N/A';
                    
                    const clsStr = (latest.classes || []).join(', ');
                    
                    const dt = parseDate(latest.timestamp) || new Date();
                    const dtStr = dt.toLocaleString();
                    const timeStr = dt.toLocaleTimeString();
                    const deviceStr = latest.device_id || 'Unknown';

                    // Update main frame immediately
                    updateMainFrame(latest.image_base64, clsStr, maxConf, deviceStr, dtStr);

                    // Add to gallery
                    if (galleryGrid) {
                        const item = document.createElement('div');
                        item.className = 'gallery-item';
                        item.setAttribute('data-id', escapeHtml(latest.id));
                        item.setAttribute('data-img', escapeHtml(latest.image_base64));
                        item.setAttribute('data-classes', escapeHtml(clsStr));
                        item.setAttribute('data-conf', escapeHtml(maxConf));
                        item.setAttribute('data-device', escapeHtml(deviceStr));
                        item.setAttribute('data-time', escapeHtml(dtStr));
                        
                        item.innerHTML = `
                            <img src="data:image/jpeg;base64,${escapeHtml(latest.image_base64)}" alt="Thumbnail" />
                            <div class="gallery-overlay">
                                <div class="gallery-overlay-text">
                                    <span class="g-cls">${escapeHtml(clsStr)}</span>
                                    <span class="g-time">${escapeHtml(timeStr)}</span>
                                </div>
                            </div>
                        `;

                        galleryGrid.insertBefore(item, galleryGrid.firstChild);

                        // Enforce max 6 items
                        while (galleryGrid.children.length > 6) {
                            galleryGrid.removeChild(galleryGrid.lastChild);
                        }

                        if (galleryCount) {
                            galleryCount.textContent = galleryGrid.children.length;
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Polling error:', err);
            setStatus(false);
        }
    }

    // Start polling every 5 seconds
    setInterval(pollLatestDetection, 5000);
});

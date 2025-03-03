// PDF.js initialization
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
pdfjsLib.GlobalWorkerOptions.useWorkerFetch = true;

// Font and CMAP configuration
const CMAP_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/cmaps/';
const FONT_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/standard_fonts/';

// Variables for PDF rendering
let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
let canvas = document.getElementById('pdf-canvas');
let ctx = canvas.getContext('2d');
let scale = 1.5;

// Function to make all form fields read-only
function makeFormReadOnly(form) {
    // Get all input elements in the form
    const formElements = Array.from(form.elements);
    
    // Make each element read-only
    formElements.forEach(element => {
        // Handle different input types
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            element.setAttribute('readonly', 'readonly');
            element.style.backgroundColor = '#f0f0f0';
            element.style.cursor = 'not-allowed';
            element.style.opacity = '0.8';
        } else if (element.tagName === 'SELECT') {
            element.setAttribute('disabled', 'disabled');
            element.style.backgroundColor = '#f0f0f0';
            element.style.cursor = 'not-allowed';
            element.style.opacity = '0.8';
        } else if (element.tagName === 'BUTTON') {
            // Avoid reference to external submitButton variable
            element.setAttribute('disabled', 'disabled');
            element.style.cursor = 'not-allowed';
            element.style.opacity = '0.8';
        }
    });
    
    // Disable signature pad
    const signatureCanvas = document.getElementById('signature-pad');
    if (signatureCanvas) {
        // Remove all event listeners by cloning and replacing
        const signatureContainer = signatureCanvas.parentNode;
        const newCanvas = signatureCanvas.cloneNode(true);
        signatureContainer.replaceChild(newCanvas, signatureCanvas);
        
        // Add "read-only" overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(240, 240, 240, 0.5)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '10';
        overlay.innerHTML = '<span style="background: white; padding: 5px 10px; border-radius: 4px; font-size: 14px;">Signature Submitted</span>';
        
        if (signatureContainer.style.position !== 'relative') {
            signatureContainer.style.position = 'relative';
        }
        signatureContainer.appendChild(overlay);
    }
    
    // Disable clear and accept signature buttons
    const clearButton = document.getElementById('clear-signature');
    if (clearButton) clearButton.setAttribute('disabled', 'disabled');
    
    const acceptButton = document.getElementById('accept-signature');
    if (acceptButton) acceptButton.setAttribute('disabled', 'disabled');
    
    // Add form-wide indicator that it's in read-only mode
    const readOnlyBanner = document.createElement('div');
    readOnlyBanner.style.backgroundColor = '#e9f7fe';
    readOnlyBanner.style.color = '#0277bd';
    readOnlyBanner.style.padding = '10px';
    readOnlyBanner.style.borderRadius = '4px';
    readOnlyBanner.style.marginBottom = '15px';
    readOnlyBanner.style.textAlign = 'center';
    readOnlyBanner.style.fontWeight = 'bold';
    readOnlyBanner.innerHTML = '<i class="fas fa-lock"></i> Form submitted and locked. Your information is displayed in read-only mode.';
    
    // Insert the banner at the top of the form
    form.insertBefore(readOnlyBanner, form.firstChild);
}

// Load the PDF
function loadPDF() {
    const url = './assets/Buyer Agreement to Show Property.pdf';
    
    console.log("Loading PDF from:", url);
    
    // Configure PDF.js with font loading options
    pdfjsLib.getDocument({
        url: url,
        cMapUrl: CMAP_URL,
        cMapPacked: true,
        standardFontDataUrl: FONT_URL,
        disableFontFace: false,
        stopAtErrors: false,
    }).promise.then(function(pdf) {
        console.log("PDF loaded successfully:", pdf.numPages, "pages");
        pdfDoc = pdf;
        
        // Update page count
        const pageCountElement = document.getElementById('page-count');
        if (pageCountElement) {
            pageCountElement.textContent = pdf.numPages;
        }
        
        renderPage(pageNum);
    }).catch(function(error) {
        // If PDF fails to load, show a placeholder with detailed error
        console.error('Error loading PDF:', error);
        
        if (!canvas) {
            console.error("Canvas element not found!");
            return;
        }
        
        // Set canvas dimensions
        canvas.width = canvas.width || 600;
        canvas.height = canvas.height || 800;
        
        ctx.fillStyle = '#f1f1f1';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'red';
        ctx.font = '20px Arial';
        ctx.fillText('PDF preview not available.', 50, 100);
        ctx.font = '16px Arial';
        ctx.fillText('Error: ' + error.message, 50, 130);
    });
}

// Render the specified page
function renderPage(num) {
    if (!pdfDoc) {
        console.error("No PDF document loaded");
        return;
    }
    
    pageRendering = true;
    
    // Using promise to fetch the page
    pdfDoc.getPage(num).then(function(page) {
        console.log("Rendering page", num);
        const viewport = page.getViewport({ scale: scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Render PDF page into canvas context
        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        
        const renderTask = page.render(renderContext);
        
        // Wait for rendering to finish
        renderTask.promise.then(function() {
            console.log("Page rendered successfully");
            pageRendering = false;
            
            if (pageNumPending !== null) {
                // New page rendering is pending
                renderPage(pageNumPending);
                pageNumPending = null;
            }
        }).catch(function(renderError) {
            console.warn('Error rendering page:', renderError);
            pageRendering = false;
            
            if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
            }
            
            // Draw fallback content
            ctx.fillStyle = '#f8f9fa';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#495057';
            ctx.font = '16px Arial';
            ctx.fillText(`Page ${num} rendering issue. You can still continue.`, 50, 100);
        });
    }).catch(function(pageError) {
        console.error('Error getting page:', pageError);
        pageRendering = false;
        
        if (pageNumPending !== null) {
            renderPage(pageNumPending);
            pageNumPending = null;
        }
    });
    
    // Update page numbers
    const pageNumElement = document.getElementById('page-num');
    if (pageNumElement) {
        pageNumElement.textContent = num;
    }
}

// Generate and format dates
function setupDateFields() {
    // Get current date
    const today = new Date();
    
    // Format today's date as MM/DD/YYYY
    const formattedToday = (today.getMonth() + 1).toString().padStart(2, '0') + '/' + 
                        today.getDate().toString().padStart(2, '0') + '/' + 
                        today.getFullYear();
    
    // Calculate expiration date (2 months from today)
    const expirationDate = new Date(today);
    expirationDate.setMonth(today.getMonth() + 2);
    
    // Format expiration date as MM/DD/YYYY
    const formattedExpiration = (expirationDate.getMonth() + 1).toString().padStart(2, '0') + '/' + 
                               expirationDate.getDate().toString().padStart(2, '0') + '/' + 
                               expirationDate.getFullYear();
    
    // Store the dates for form submission
    const hiddenStartDate = document.getElementById('hiddenStartDate');
    const hiddenExpirationDate = document.getElementById('hiddenExpirationDate');
    
    if (hiddenStartDate) hiddenStartDate.value = formattedToday;
    if (hiddenExpirationDate) hiddenExpirationDate.value = formattedExpiration;
}

// Initialize signature pad
function initSignaturePad() {
    const signatureCanvas = document.getElementById('signature-pad');
    if (!signatureCanvas) {
        console.error("Signature pad canvas not found");
        return;
    }
    
    const signatureCtx = signatureCanvas.getContext('2d');
    let isDrawing = false;
    
    // Set canvas dimensions
    signatureCanvas.width = signatureCanvas.offsetWidth;
    signatureCanvas.height = signatureCanvas.offsetHeight;
    
    // Fill with white background
    signatureCtx.fillStyle = 'white';
    signatureCtx.fillRect(0, 0, signatureCanvas.width, signatureCanvas.height);
    
    // Drawing events
    signatureCanvas.addEventListener('mousedown', startDrawing);
    signatureCanvas.addEventListener('mousemove', draw);
    signatureCanvas.addEventListener('mouseup', stopDrawing);
    signatureCanvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events
    signatureCanvas.addEventListener('touchstart', startDrawingTouch);
    signatureCanvas.addEventListener('touchmove', drawTouch);
    signatureCanvas.addEventListener('touchend', stopDrawing);
    
    function startDrawing(e) {
        isDrawing = true;
        signatureCtx.beginPath();
        signatureCtx.moveTo(e.offsetX, e.offsetY);
    }
    
    function draw(e) {
        if (!isDrawing) return;
        
        signatureCtx.lineWidth = 2;
        signatureCtx.lineCap = 'round';
        signatureCtx.strokeStyle = 'black';
        
        signatureCtx.lineTo(e.offsetX, e.offsetY);
        signatureCtx.stroke();
    }
    
    function startDrawingTouch(e) {
        e.preventDefault();
        
        const rect = signatureCanvas.getBoundingClientRect();
        const touch = e.touches[0];
        const offsetX = touch.clientX - rect.left;
        const offsetY = touch.clientY - rect.top;
        
        isDrawing = true;
        signatureCtx.beginPath();
        signatureCtx.moveTo(offsetX, offsetY);
    }
    
    function drawTouch(e) {
        e.preventDefault();
        
        if (!isDrawing) return;
        
        const rect = signatureCanvas.getBoundingClientRect();
        const touch = e.touches[0];
        const offsetX = touch.clientX - rect.left;
        const offsetY = touch.clientY - rect.top;
        
        signatureCtx.lineWidth = 2;
        signatureCtx.lineCap = 'round';
        signatureCtx.strokeStyle = 'black';
        
        signatureCtx.lineTo(offsetX, offsetY);
        signatureCtx.stroke();
    }
    
    function stopDrawing() {
        isDrawing = false;
    }
    
    // Clear signature
    const clearButton = document.getElementById('clear-signature');
    if (clearButton) {
        clearButton.addEventListener('click', function() {
            signatureCtx.fillStyle = 'white';
            signatureCtx.fillRect(0, 0, signatureCanvas.width, signatureCanvas.height);
            
            const signatureData = document.getElementById('signature-data');
            if (signatureData) signatureData.value = ''; // Clear hidden input
        });
    }
    
    // Accept signature with visual feedback
    const acceptButton = document.getElementById('accept-signature');
    if (acceptButton) {
        acceptButton.addEventListener('click', function() {
            const signatureData = signatureCanvas.toDataURL();
            
            const signatureDataInput = document.getElementById('signature-data');
            if (signatureDataInput) signatureDataInput.value = signatureData; // Store in hidden input
            
            // Add visual feedback
            const originalText = this.innerHTML;
            const originalBg = this.style.backgroundColor;
            
            // Show confirmation visually
            this.innerHTML = '<i class="fas fa-check"></i> Accepted!';
            this.style.backgroundColor = '#28a745'; // Success green color
            
            // Create notification
            const notification = document.createElement('div');
            notification.style.position = 'absolute';
            notification.style.top = '0';
            notification.style.left = '0';
            notification.style.right = '0';
            notification.style.backgroundColor = 'rgba(40, 167, 69, 0.8)';
            notification.style.color = 'white';
            notification.style.padding = '8px';
            notification.style.textAlign = 'center';
            notification.style.borderRadius = '0 0 4px 4px';
            notification.style.zIndex = '1000';
            notification.innerHTML = '<i class="fas fa-check-circle"></i> Signature accepted!';
            
            const signatureContainer = document.querySelector('.signature-container');
            if (signatureContainer) {
                signatureContainer.style.position = 'relative';
                signatureContainer.appendChild(notification);
                
                // Reset after 2 seconds
                setTimeout(function() {
                    acceptButton.innerHTML = originalText;
                    acceptButton.style.backgroundColor = originalBg;
                    notification.style.opacity = '0';
                    notification.style.transition = 'opacity 0.5s';
                    
                    // Remove notification after fade out
                    setTimeout(function() {
                        signatureContainer.removeChild(notification);
                    }, 500);
                }, 2000);
            }
        });
    }
}

// PDF Generation Function with Signature in Correct Position
async function generateCompletedPDF() {
    try {
        // Path to your PDF
        const pdfUrl = './assets/Buyer Agreement to Show Property.pdf';
        
        console.log("Generating completed PDF");
        
        // Fetch the PDF
        const response = await fetch(pdfUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const pdfBytes = await response.arrayBuffer();
        
        // Get the form data
        const fullName = document.getElementById('fullName')?.value || '';
        const startDate = document.getElementById('hiddenStartDate')?.value || '';
        const expirationDate = document.getElementById('hiddenExpirationDate')?.value || '';
        const signatureData = document.getElementById('signature-data')?.value || '';
        
        // Load the PDF document
        const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
        
        // Get the form
        const form = pdfDoc.getForm();
        
        // List all fields in the PDF for debugging
        const fields = form.getFields();
        console.log(`DEBUG: PDF has ${fields.length} form fields:`);
        fields.forEach(field => {
            console.log(`- Field: "${field.getName()}" (${field.constructor.name})`);
        });
        
        // Fill the form fields
        try {
            const nameField = form.getTextField('Name');
            nameField.setText(fullName);
            console.log('Successfully filled "Name" field with:', fullName);
        } catch (error) {
            console.error('Error filling "Name" field:', error.message);
        }
        
        try {
            const startDateField = form.getTextField('StartDate');
            startDateField.setText(startDate);
            console.log('Successfully filled "StartDate" field with:', startDate);
        } catch (error) {
            console.error('Error filling "StartDate" field:', error.message);
        }
        
        try {
            const endDateField = form.getTextField('EndDate');
            endDateField.setText(expirationDate);
            console.log('Successfully filled "EndDate" field with:', expirationDate);
        } catch (error) {
            console.error('Error filling "EndDate" field:', error.message);
        }
        
        try {
            const sigDateField = form.getTextField('SigDate');
            sigDateField.setText(startDate);
            console.log('Successfully filled "SigDate" field with:', startDate);
        } catch (error) {
            console.error('Error filling "SigDate" field:', error.message);
        }
        
        try {
            const residentialCheckbox = form.getCheckBox('Residential');
            residentialCheckbox.check();
            console.log('Successfully checked "Residential" checkbox');
        } catch (error) {
            console.warn('Could not check Residential checkbox:', error.message);
        }
        
        try {
            const percentageCheckbox = form.getCheckBox('Percentage');
            percentageCheckbox.check();
            console.log('Successfully checked "Percentage" checkbox');
        } catch (error) {
            console.warn('Could not check Percentage checkbox:', error.message);
        }
        
        try {
            const percentageValueField = form.getTextField('PercentageValue');
            percentageValueField.setText("1");
            console.log('Successfully set percentage value to 1');
        } catch (error) {
            console.warn('Could not set percentage value:', error.message);
        }
        
        // Place signature in the correct location
        if (signatureData) {
            try {
                // Embed the signature image
                const signatureImage = await pdfDoc.embedPng(signatureData);
                
                // Get all pages of the PDF
                const pages = pdfDoc.getPages();
                const lastPage = pages[pages.length - 1];
                
                // Get page dimensions
                const { width, height } = lastPage.getSize();
                
                // HARDCODED PLACEMENT based on screenshot
                // Position signature in the RED circle area (left of signature date)
                // The exact position needs to match your specific PDF
                // These values need to be adjusted based on your specific PDF layout
                const signatureX = width * 0.12;  // Horizontal - left side
                const signatureY = height * 0.28;  // Vertical - based on screenshot (red circle area)
                
                // Size of the signature
                const sigWidth = width * 0.2;    // Width of signature 
                const sigHeight = height * 0.04;  // Height of signature
                
                // Draw the signature
                lastPage.drawImage(signatureImage, {
                    x: signatureX,
                    y: signatureY,
                    width: sigWidth,
                    height: sigHeight
                });
                
                console.log(`Placed signature at x:${signatureX}, y:${signatureY} with dimensions ${sigWidth}x${sigHeight}`);
            } catch (error) {
                console.error("Error adding signature:", error);
            }
        }
        
        // Save the PDF
        const modifiedPdfBytes = await pdfDoc.save({
            updateFieldAppearances: true
        });
        
        console.log("PDF saved successfully");
        return modifiedPdfBytes;
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
}

// Function to handle redirect countdown
function startRedirectCountdown() {
    console.log("Countdown started");
    let seconds = 10;
    const countdownElement = document.getElementById('countdown');
    
    if (!countdownElement) {
        console.error("Countdown element not found");
        return;
    }
    
    countdownElement.textContent = seconds;
    
    const countdownInterval = setInterval(function() {
        seconds--;
        countdownElement.textContent = seconds;
        
        if (seconds <= 0) {
            clearInterval(countdownInterval);
            window.location.href = 'index.html';
        }
    }, 1000);
}

// Initialize everything when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("Document loaded, initializing application");
    
    // Initialize PDF.js
    loadPDF();
    
    // Initialize the signature pad
    initSignaturePad();
    
    // Set up auto-dates
    setupDateFields();
    
    // Handle form submission
    const agreementForm = document.getElementById('agreement-form');
    if (agreementForm) {
        agreementForm.addEventListener('submit', async function(e) {
            // Prevent default form submission to validate first
            e.preventDefault();
            
            // Validation
            let validationMessage = '';
            
            if (!document.getElementById('fullName')?.value) {
                validationMessage += "• Please enter your full name\n";
            }
            
            if (!document.getElementById('initials')?.value) {
                validationMessage += "• Please enter your initials\n";
            }
            
            if (!document.getElementById('read')?.checked) {
                validationMessage += "• Please confirm you've read the agreement\n";
            }
            
            if (!document.getElementById('terms')?.checked) {
                validationMessage += "• Please agree to the terms\n";
            }
            
            // Check if signature exists and is valid
            const signatureCanvas = document.getElementById('signature-pad');
            if (signatureCanvas) {
                const signatureData = signatureCanvas.toDataURL();
                const signatureDataInput = document.getElementById('signature-data');
                if (signatureDataInput) signatureDataInput.value = signatureData;
                
                // A valid signature will have more data than an empty canvas
                const isEmptySignature = signatureData.length < 1000;
                
                if (isEmptySignature) {
                    validationMessage += "• Please sign the agreement\n";
                }
            }
            
            // If there are validation errors, show them and stop form submission
            if (validationMessage) {
                alert("Please complete the following:\n" + validationMessage);
                return false;
            }
            
            // Show loading state
            const submitButton = this.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerText = "Submitting...";
            }
            
            try {
                // Generate PDF with fields filled in
                const pdfBytes = await generateCompletedPDF();
                
                // Create a Blob from the PDF bytes
                const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
                
                // Create a File object from the Blob
                const fullName = document.getElementById('fullName')?.value || 'User';
                const fileName = `BuyerBrokerAgreement_${fullName.replace(/\s+/g, '_')}.pdf`;
                const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
                
                // Create FormData for submission
                const formData = new FormData();
                
                // Add form fields to FormData
                const formElements = Array.from(this.elements);
                formElements.forEach(element => {
                    if (element.name && element.name !== 'signature') {
                        if (element.type === 'checkbox') {
                            formData.append(element.name, element.checked);
                        } else {
                            formData.append(element.name, element.value);
                        }
                    }
                });
                
                // Add the PDF file as an attachment
                formData.append('agreement_pdf', pdfFile);
                
                // Submit the form to FormSubmit.co
                const response = await fetch(this.action, {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok || response.status === 0) { // FormSubmit sometimes returns status 0
                    // Download the PDF for the user
                    const downloadUrl = URL.createObjectURL(pdfBlob);
                    const downloadLink = document.createElement('a');
                    downloadLink.href = downloadUrl;
                    downloadLink.download = fileName;
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);
                    URL.revokeObjectURL(downloadUrl);
                    
                    // Make form read-only
                    makeFormReadOnly(this);
                    
                    if (submitButton) submitButton.style.display = 'none';
                    
                    const thankYouMessage = document.getElementById('thank-you-message');
                    if (thankYouMessage) thankYouMessage.style.display = 'block';
                    
                    // Start the countdown
                    startRedirectCountdown();
                } else {
                    throw new Error('Form submission failed');
                }
            } catch (error) {
                console.error('Error processing form:', error);
                alert('There was a problem with your submission. Please try again.');
                
                // Re-enable the submit button
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerText = "Submit Signed Agreement";
                }
            }
        });
    }
    
    // Check for success parameter in URL (for FormSubmit.co redirect)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
        const thankYouMessage = document.getElementById('thank-you-message');
        const submitBtn = document.querySelector('.submit-btn');
        
        if (thankYouMessage) thankYouMessage.style.display = 'block';
        if (submitBtn) submitBtn.style.display = 'none';
        
        // ADDED: If coming back from success URL, also make the form read-only
        const agreementForm = document.getElementById('agreement-form');
        if (agreementForm) {
            makeFormReadOnly(agreementForm);
        }
        
        startRedirectCountdown();
    }
});
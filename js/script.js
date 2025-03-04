// Tab functionality
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked button and corresponding content
        button.classList.add('active');
        const tabId = button.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
    });
});

// Share functionality for process steps
const shareButtons = document.querySelectorAll('.share-button');

// Check if URL contains a step hash and scroll to it
window.addEventListener('DOMContentLoaded', () => {
    if (window.location.hash) {
        const targetStep = document.querySelector(window.location.hash);
        if (targetStep) {
            // Ensure the process tab is active
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            document.querySelector('[data-tab="process"]').classList.add('active');
            document.getElementById('process').classList.add('active');
            
            // Scroll to the target step
            setTimeout(() => {
                targetStep.scrollIntoView({ behavior: 'smooth' });
            }, 300);
        }
    }
});

// Share functionality
shareButtons.forEach(button => {
    button.addEventListener('click', async () => {
        const stepId = button.getAttribute('data-step');
        const url = `${window.location.origin}${window.location.pathname}#${stepId}`;
        
        // Create a temporary modal/tooltip for sharing options
        const modal = document.createElement('div');
        modal.className = 'share-modal';
        modal.innerHTML = `
            <div class="share-modal-content">
                <h4>Share this step</h4>
                <div class="share-options">
                    <button id="copy-link" class="share-option">
                        <i class="fas fa-copy"></i> Copy Link
                    </button>
                    <a href="sms:?body=Check out this step in the home buying process: ${url}" class="share-option">
                        <i class="fas fa-sms"></i> Text
                    </a>
                    <a href="mailto:?subject=Home Buying Process Step&body=Here's information about this step in the home buying process: ${url}" class="share-option">
                        <i class="fas fa-envelope"></i> Email
                    </a>
                </div>
                <button class="close-modal">Close</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Handle copy link button
        document.getElementById('copy-link').addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(url);
                document.getElementById('copy-link').innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => {
                    document.getElementById('copy-link').innerHTML = '<i class="fas fa-copy"></i> Copy Link';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy: ', err);
            }
        });
        
        // Close modal when clicking the close button or outside the modal
        document.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    });
});

// FAQ functionality
document.addEventListener('DOMContentLoaded', function() {
    // Step FAQ data - these would be your actual FAQs
    const faqData = {
        'step1-faq': [
            {
                question: "Is there a fee for the initial consultation?",
                answer: "No, the initial consultation is completely free with no obligation. It's my chance to understand your needs and demonstrate how I can help you."
            },
            {
                question: "What should I prepare for our first meeting?",
                answer: "It's helpful to have a general idea of your budget, preferred neighborhoods, and must-have features. Also, if you've started the pre-approval process with a lender, bring that information along."
            },
            {
                question: "How long does the initial consultation take?",
                answer: "Typically 45-60 minutes, either in person at my office or via video call, whichever is more convenient for you."
            }
        ],
        'step2-faq': [
            {
                question: "Is the Home Touring Agreement legally binding?",
                answer: "Yes, it's a legal document that establishes our professional relationship for viewing properties. However, it's specifically limited to the home touring process."
            },
            {
                question: "Can I cancel the agreement if I change my mind?",
                answer: "Yes, the agreement includes terms for cancellation. I believe in making this process pressure-free."
            },
            {
                question: "Do I need to sign a different agreement later in the process?",
                answer: "If you decide to move forward with a purchase, we'll sign a more comprehensive Exclusive Right to Represent Buyer Agreement that covers the entire transaction."
            }
        ],
        'step3-faq': [
            {
                question: "How many homes can we see in one day?",
                answer: "I typically recommend viewing 4-5 homes in a day to avoid 'home viewing fatigue.' Quality viewings are better than quantity."
            },
            {
                question: "What happens if I find a house online that I want to see?",
                answer: "Simply send me the listing and I'll schedule a viewing as soon as possible. I'm very responsive to these requests."
            },
            {
                question: "Will you point out potential problems with a house?",
                answer: "I'll share market information, comparable sales data, and neighborhood insights to help guide your decision-making process. For property condition assessment, I'll recommend professional home inspectors who are licensed to identify and evaluate potential issues. My role is to help you make informed decisions by providing real estate expertise, while ensuring you have access to qualified professionals for technical evaluations."
            }
        ],
        'step4-faq': [
            {
                question: "How long does the seller have to respond to our offer?",
                answer: "We set a deadline in the offer, typically 24-48 hours, but this is negotiable based on the circumstances."
            },
            {
                question: "Is my earnest money refundable?",
                answer: "Yes, under certain conditions specified in the contract, such as during the inspection period if issues are found, or if the seller fails to fulfill their obligations."
            },
            {
                question: "How much earnest money should I offer?",
                answer: "In the Tucson market, 1-2% of the purchase price is standard, but we'll strategize based on the specific property and how competitive the situation is."
            }
        ],
        'step5-faq': [
            {
                question: "Who pays for the home inspection?",
                answer: "The buyer typically pays for inspections. In Arizona, they usually cost $350-$500 depending on the home size and type of inspection."
            },
            {
                question: "What if the inspection reveals major problems?",
                answer: "We can request repairs, ask for a credit to handle repairs yourself, renegotiate the price, or walk away with your earnest money returned."
            },
            {
                question: "Are there any inspections beyond the general home inspection?",
                answer: "Yes, depending on the property, we might recommend termite inspections, roof inspections, pool inspections, or HVAC system reviews."
            }
        ],
        'step6-faq': [
            {
                question: "What happens if the home doesn't appraise for the offer price?",
                answer: "We have several options: negotiate with the seller to lower the price, cover the difference in cash, or in some cases, request a second appraisal."
            },
            {
                question: "How long does the loan approval process take?",
                answer: "In Arizona, it typically takes 30-45 days for full loan processing, which is why we build this time into the contract."
            },
            {
                question: "What documents will I need to provide to my lender?",
                answer: "Typically, you'll need recent pay stubs, W-2s or tax returns for the past two years, bank statements, and documentation for any other assets or income sources."
            }
        ],
        'step7-faq': [
            {
                question: "What if agreed-upon repairs weren't completed?",
                answer: "We have several options: delay closing until repairs are complete, negotiate a credit at closing, or in serious cases, extend the contract period."
            },
            {
                question: "Should I bring anything to the final walkthrough?",
                answer: "Bring your inspection report, repair request documents, and a way to test systems (phone charger for outlets, etc.). I'll bring a checklist to ensure we don't miss anything."
            },
            {
                question: "What if the home isn't clean or the sellers left items behind?",
                answer: "The contract typically requires the home to be in 'broom-clean' condition. If significant items are left behind, we can negotiate a solution before closing."
            }
        ],
        'step8-faq': [
            {
                question: "What forms of payment are accepted for closing costs?",
                answer: "You'll need to bring a cashier's check or wire the funds in advance. Personal checks are typically not accepted for amounts over $1,000."
            },
            {
                question: "When do I get the keys to my new home?",
                answer: "In Arizona, you typically receive the keys immediately after closing when all documents are signed and funds have been transferred."
            },
            {
                question: "How long does the closing appointment take?",
                answer: "Plan for about 60-90 minutes to review and sign all documents. I'll be there with you to explain anything that's unclear."
            }
        ]
    };
    
    // Select all FAQ buttons
    const faqButtons = document.querySelectorAll('.faq-button');
    
    // Add click event listeners to each FAQ button
    faqButtons.forEach(button => {
        button.addEventListener('click', function() {
            const faqId = this.getAttribute('data-step');
            
            // Create a new modal
            const modal = document.createElement('div');
            modal.className = 'faq-modal';
            
            // Get the specific FAQs for this step
            const stepFaqs = faqData[faqId] || [];
            
            // Build the FAQ HTML
            let faqsHtml = '';
            stepFaqs.forEach(faq => {
                faqsHtml += `
                    <div class="faq-item">
                        <div class="faq-question">${faq.question}</div>
                        <div class="faq-answer">${faq.answer}</div>
                    </div>
                `;
            });
            
            // Create the modal content
            const stepNumber = faqId.replace('-faq', '');
            const stepElement = document.getElementById(stepNumber);
            const stepTitle = stepElement ? stepElement.querySelector('h4').innerText : 'FAQ';
            
            modal.innerHTML = `
                <div class="faq-modal-content">
                    <h3 class="faq-title">${stepTitle}: Common Questions</h3>
                    <div class="faq-content">
                        ${faqsHtml}
                    </div>
                    <button class="close-modal">Close</button>
                </div>
            `;
            
            // Add to DOM
            document.body.appendChild(modal);
            
            // Add close functionality
            modal.querySelector('.close-modal').addEventListener('click', () => {
                document.body.removeChild(modal);
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                }
            });
        });
    });
});
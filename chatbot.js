// Chatbot Functionality (Wrapped in IIFE to avoid conflicts)
document.addEventListener('DOMContentLoaded', function() {
    (function() {
        // Initialize EmailJS
        emailjs.init("5bzzAKwHhexoL0TnN");

        const chatbotChatBox = document.getElementById("chatbot-chatBox");
        let chatbotCurrentFlow = null;
        let chatbotUserDetails = {
            type: null,
            choice: null,
            email: null,
            name: null,
            phone: null,
            state: null,
            city: null,
            resume: null,
            resumeFile: null
        };

        function chatbotAddMessage(text, sender) {
            const wrapper = document.createElement("div");
            wrapper.classList.add("chatbot-message-wrapper", sender);

            const avatar = document.createElement("div");
            avatar.classList.add("chatbot-avatar");
            avatar.innerText = sender === 'bot' ? '🤖' : '👤';

            const message = document.createElement("div");
            message.classList.add("chatbot-chat-message", sender === 'bot' ? 'chatbot-bot' : 'chatbot-user');
            message.innerText = text;

            wrapper.appendChild(avatar);
            wrapper.appendChild(message);
            chatbotChatBox.appendChild(wrapper);
            chatbotChatBox.scrollTop = chatbotChatBox.scrollHeight;
        }

        function chatbotAddOptions(options) {
            const optionsDiv = document.createElement("div");
            optionsDiv.classList.add("chatbot-options");
            options.forEach(opt => {
                const btn = document.createElement("button");
                btn.classList.add("chatbot-option-btn");
                btn.innerText = opt.label;
                btn.onclick = () => {
                    chatbotAddMessage(opt.label, "user");
                    opt.action();
                };
                optionsDiv.appendChild(btn);
            });
            chatbotChatBox.appendChild(optionsDiv);
            chatbotChatBox.scrollTop = chatbotChatBox.scrollHeight;
        }

        function chatbotSendMessage() {
            const inputField = document.getElementById("chatbot-userInput");
            const userText = inputField.value.trim();
            if (!userText) return;

            chatbotAddMessage(userText, "user");

            if (chatbotCurrentFlow === "admission_email" || chatbotCurrentFlow === "job_email") {
                if (chatbotValidateEmail(userText)) {
                    chatbotUserDetails.email = userText;
                    chatbotAddMessage("✅ Email saved. Please enter your Full Name:", "bot");
                    chatbotCurrentFlow = "collect_name";
                } else {
                    chatbotAddMessage("⚠️ Invalid email. Please enter a correct one.", "bot");
                }
            } 
            else if (chatbotCurrentFlow === "collect_name") {
                chatbotUserDetails.name = userText;
                chatbotAddMessage("Got it 👍 Now, please enter your Mobile Number:", "bot");
                chatbotCurrentFlow = "collect_phone";
            } 
            else if (chatbotCurrentFlow === "collect_phone") {
                if (/^[0-9]{10}$/.test(userText)) {
                    chatbotUserDetails.phone = userText;
                    chatbotAddMessage("✅ Thanks! Now, please enter your State:", "bot");
                    chatbotCurrentFlow = "collect_state";
                } else {
                    chatbotAddMessage("⚠️ Invalid phone. Please enter 10-digit number.", "bot");
                }
            }
            else if (chatbotCurrentFlow === "collect_state") {
                chatbotUserDetails.state = userText;
                chatbotAddMessage("Got it! Now, please enter your City:", "bot");
                chatbotCurrentFlow = "collect_city";
            }
            else if (chatbotCurrentFlow === "collect_city") {
                chatbotUserDetails.city = userText;
                if (chatbotUserDetails.type === "Job") {
                    chatbotAddMessage("Got it! Now, please upload your resume (PDF, DOC, or DOCX under 5MB):", "bot");
                    chatbotCurrentFlow = "collect_resume";
                } else {
                    chatbotAddMessage("✅ Thanks! Submitting your enquiry...", "bot");
                    chatbotSubmitEnquiry();
                }
            }
            else if (chatbotCurrentFlow === "collect_resume") {
                chatbotUserDetails.resume = userText;
                chatbotAddMessage("✅ Thanks! Submitting your application...", "bot");
                chatbotSubmitEnquiry();
            }
            else {
                chatbotAddMessage("Please use the provided buttons to continue.", "bot");
            }

            inputField.value = "";
        }

        function chatbotValidateEmail(email) {
            return /\S+@\S+\.\S+/.test(email);
        }

        function chatbotSubmitEnquiry() {
            // Prepare data for EmailJS
            let message = `From chatbot: ${chatbotUserDetails.type} enquiry for ${chatbotUserDetails.choice}`;
            if (chatbotUserDetails.resumeFile) {
                message += `. Resume uploaded: ${chatbotUserDetails.resumeFile.name}`;
            } else if (chatbotUserDetails.resume) {
                message += `. Resume: ${chatbotUserDetails.resume}`;
            }

            const templateParams = {
                name: chatbotUserDetails.name,
                email: chatbotUserDetails.email,
                mobile: chatbotUserDetails.phone,
                whatsapp: '', // Optional
                state: chatbotUserDetails.state,
                city: chatbotUserDetails.city,
                program: chatbotUserDetails.choice,
                message: message,
            };

            // Different service and template for job and admission
            let serviceId, templateId;
            if (chatbotUserDetails.type === "Job") {
                serviceId = "service_3b55vob"; // Replace with actual job service ID
                templateId = "template_g509kkg"; // Replace with actual job template ID
            } else {
                serviceId = "service_3b55vob"; // Admission service ID
                templateId = "template_pfwo2ef"; // Admission template ID
            }

            // Send email using EmailJS
            emailjs.send(serviceId, templateId, templateParams)
                .then(function(response) {
                    console.log('SUCCESS!', response.status, response.text);
                    chatbotAddMessage("🎉 Your enquiry has been submitted successfully! We’ll contact you soon.", "bot");
                }, function(error) {
                    console.log('FAILED...', error);
                    chatbotAddMessage("⚠️ Sorry! Something went wrong. Please try again or use the enquiry form.", "bot");
                });

            chatbotCurrentFlow = null;
        }

        // Intro messages
        function initChatbot() {
            setTimeout(() => {
                chatbotAddMessage("Hey Aspirant! Welcome to JMP paramedical", "bot");
                chatbotAddMessage("You're talking to Eva, the smartest virtual admission assistant.", "bot");
                chatbotAddOptions([
                    { label: "Are you looking for admission?", action: chatbotAdmissionFlow },
                    { label: "Are you looking for a job?", action: chatbotJobFlow }
                ]);
            }, 2000);
        }

        // Admission Flow
        function chatbotAdmissionFlow() {
            chatbotUserDetails.type = "Admission";
            chatbotAddMessage("Great! Which course are you interested in?", "bot");
            chatbotAddOptions([
                { label: "Engineering", action: () => chatbotAskEmail("admission_email", "Engineering") },
                { label: "Management", action: () => chatbotAskEmail("admission_email", "Management") },
                { label: "Medical", action: () => chatbotAskEmail("admission_email", "Medical") }
            ]);
        }

        // Job Flow
        function chatbotJobFlow() {
            chatbotUserDetails.type = "Job";
            chatbotAddMessage("Awesome! Which department are you applying for?", "bot");
            chatbotAddOptions([
                { label: "Teaching", action: () => chatbotAskEmail("job_email", "Teaching") },
                { label: "Administration", action: () => chatbotAskEmail("job_email", "Administration") },
                { label: "Technical Support", action: () => chatbotAskEmail("job_email", "Technical Support") }
            ]);
        }

        // Ask Email Step
        function chatbotAskEmail(flow, choice) {
            chatbotUserDetails.choice = choice;
            chatbotCurrentFlow = flow;
            chatbotAddMessage("Before we proceed, please enter your Email Address:", "bot");
        }

        // Toggle Chatbot
        window.toggleChatbot = function() {
            console.log('Toggle clicked');
            const widget = document.getElementById("chatbot-widget");
            const toggle = document.querySelector(".chatbot-toggle");
            if (widget.style.display === "none" || widget.style.display === "") {
                widget.style.display = "block";
                toggle.style.display = "none";
                if (!chatbotChatBox.innerHTML.trim()) {
                    initChatbot();
                }
            } else {
                widget.style.display = "none";
                toggle.style.display = "block";
                toggle.innerHTML = "💬";
            }
        };

        // File upload handling
        document.getElementById("chatbot-fileInput").addEventListener("change", function(e) {
            const file = e.target.files[0];
            if (file) {
                if (chatbotValidateFile(file)) {
                    chatbotUserDetails.resumeFile = file;
                    chatbotAddMessage(`📎 File uploaded: ${file.name}`, "user");
                    if (chatbotCurrentFlow === "collect_resume") {
                        chatbotAddMessage("✅ Thanks! Submitting your application...", "bot");
                        chatbotSubmitEnquiry();
                    }
                } else {
                    chatbotAddMessage("⚠️ Invalid file. Please upload a PDF, DOC, or DOCX file under 5MB.", "bot");
                }
            }
        });

        function chatbotValidateFile(file) {
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            const maxSize = 5 * 1024 * 1024; // 5MB
            return allowedTypes.includes(file.type) && file.size <= maxSize;
        }

        // Enter key support
        document.getElementById("chatbot-userInput").addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                chatbotSendMessage();
            }
        });

        // Expose send function globally
        window.chatbotSendMessage = chatbotSendMessage;
    })();
});

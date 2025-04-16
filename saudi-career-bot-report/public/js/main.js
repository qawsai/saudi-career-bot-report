// Saudi Career Coach Assistant - Main JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const typingIndicator = document.getElementById('typing-indicator');
    const enToggle = document.getElementById('en-toggle');
    const arToggle = document.getElementById('ar-toggle');
    const headerTitle = document.getElementById('header-title');
    const headerSubtitle = document.getElementById('header-subtitle');
    const welcomeMessage = document.getElementById('welcome-message');
    const disclaimer = document.getElementById('disclaimer');
    const chatContainer = document.getElementById('chat-container');
    const cvUpload = document.getElementById('cv-upload');
    const fileName = document.getElementById('file-name');
    const uploadText = document.getElementById('upload-text');
    const suggestedQuestions = document.getElementById('suggested-questions');
    const questionsContainer = document.querySelector('.questions-container');
    
    // State variables
    let currentLanguage = 'en';
    let cvFile = null;
    let controller = null; // AbortController for fetch requests
    let isGenerating = false; // Flag to track if response is being generated
    
    // Translations
    const translations = {
        en: {
            headerTitle: 'Saudi Career Coach Assistant',
            headerSubtitle: 'Your professional development partner',
            welcomeMessage: "Hello! I'm your Career Coach Assistant specializing in the Saudi Arabian job market. I can help with career advice, job seeking strategies, interview preparation, and professional development. How can I assist you today?",
            inputPlaceholder: "Ask about career advice, job seeking, interviews...",
            disclaimer: "This assistant is designed to provide career guidance for the Saudi Arabian job market only. For other topics, please consult appropriate resources.",
            uploadCV: "Upload CV",
            suggestedQuestionsTitle: "Suggested Questions",
            initialQuestions: [
                "How can I improve my CV?",
                "What are the top skills in demand?",
                "How to prepare for interviews?"
            ],
            uploadingCV: "Uploading your CV...",
            analyzingCV: "Analyzing your CV...",
            cvUploadError: "Error uploading CV. Please try again.",
            invalidFileType: "Only PDF files are accepted.",
            fileSizeExceeded: "File size exceeds 5MB limit.",
            stopGeneration: "Stop"
        },
        ar: {
            headerTitle: 'مساعد المسار المهني السعودي',
            headerSubtitle: 'شريكك في التطوير المهني',
            welcomeMessage: "مرحبًا! أنا مساعد المسار المهني المتخصص في سوق العمل السعودي. يمكنني المساعدة في تقديم المشورة المهنية، واستراتيجيات البحث عن عمل، والتحضير للمقابلات، والتطوير المهني. كيف يمكنني مساعدتك اليوم؟",
            inputPlaceholder: "اسأل عن نصائح مهنية، البحث عن وظيفة، المقابلات...",
            disclaimer: "تم تصميم هذا المساعد لتقديم التوجيه المهني لسوق العمل السعودي فقط. للمواضيع الأخرى، يرجى الرجوع إلى الموارد المناسبة.",
            uploadCV: "تحميل السيرة الذاتية",
            suggestedQuestionsTitle: "أسئلة مقترحة",
            initialQuestions: [
                "كيف يمكنني تحسين سيرتي الذاتية؟",
                "ما هي أهم المهارات المطلوبة؟",
                "كيف أستعد للمقابلات؟"
            ],
            uploadingCV: "جاري تحميل السيرة الذاتية...",
            analyzingCV: "جاري تحليل السيرة الذاتية...",
            cvUploadError: "خطأ في تحميل السيرة الذاتية. يرجى المحاولة مرة أخرى.",
            invalidFileType: "يتم قبول ملفات PDF فقط.",
            fileSizeExceeded: "حجم الملف يتجاوز الحد المسموح به وهو 5 ميجابايت.",
            stopGeneration: "توقف"
        }
    };
    
    // Initialize suggested questions
    function updateSuggestedQuestions(questions) {
        questionsContainer.innerHTML = '';
        questions.forEach(question => {
            const button = document.createElement('button');
            button.className = 'question-btn';
            button.textContent = question;
            button.addEventListener('click', () => {
                userInput.value = question;
                sendMessage();
            });
            questionsContainer.appendChild(button);
        });
    }
    
    // Generate context-aware suggested questions based on bot response
    function generateSuggestedQuestions(botResponse) {
        // Default questions if we can't generate context-specific ones
        let defaultQuestions = translations[currentLanguage].initialQuestions;
        
        // Simple keyword-based question generation
        const questionSets = {
            en: {
                cv: [
                    "What sections should my CV include?",
                    "How long should my CV be?",
                    "Should I include a photo in my CV?"
                ],
                interview: [
                    "What are common interview questions?",
                    "How should I dress for an interview?",
                    "How do I answer 'tell me about yourself'?"
                ],
                skills: [
                    "Which technical skills are most valuable?",
                    "How can I develop soft skills?",
                    "What certifications are worth pursuing?"
                ],
                salary: [
                    "What's the average salary for my position?",
                    "How do I negotiate my salary?",
                    "When should I ask about compensation?"
                ]
            },
            ar: {
                "سيرة ذاتية": [
                    "ما هي الأقسام التي يجب أن تتضمنها سيرتي الذاتية؟",
                    "ما هو الطول المناسب للسيرة الذاتية؟",
                    "هل يجب أن أضع صورة في سيرتي الذاتية؟"
                ],
                "مقابلة": [
                    "ما هي أسئلة المقابلة الشائعة؟",
                    "كيف يجب أن أرتدي للمقابلة؟",
                    "كيف أجيب على 'أخبرني عن نفسك'؟"
                ],
                "مهارات": [
                    "ما هي المهارات التقنية الأكثر قيمة؟",
                    "كيف يمكنني تطوير المهارات الشخصية؟",
                    "ما هي الشهادات التي تستحق المتابعة؟"
                ],
                "راتب": [
                    "ما هو متوسط الراتب لمنصبي؟",
                    "كيف أتفاوض على راتبي؟",
                    "متى يجب أن أسأل عن التعويض؟"
                ]
            }
        };
        
        // Check for keywords in the response
        const keywordSets = questionSets[currentLanguage];
        let newQuestions = [];
        
        for (const [keyword, questions] of Object.entries(keywordSets)) {
            if (botResponse.toLowerCase().includes(keyword.toLowerCase())) {
                // Add up to 2 questions from this category
                newQuestions = newQuestions.concat(questions.slice(0, 2));
                if (newQuestions.length >= 3) break;
            }
        }
        
        // If we found context-specific questions, use them; otherwise use defaults
        if (newQuestions.length > 0) {
            // Ensure we have at most 3 questions
            return newQuestions.slice(0, 3);
        } else {
            return defaultQuestions;
        }
    }
    
    // Switch language
    function switchLanguage(lang) {
        currentLanguage = lang;
        
        // Update UI elements
        headerTitle.textContent = translations[lang].headerTitle;
        headerSubtitle.textContent = translations[lang].headerSubtitle;
        welcomeMessage.textContent = translations[lang].welcomeMessage;
        userInput.placeholder = translations[lang].inputPlaceholder;
        disclaimer.textContent = translations[lang].disclaimer;
        uploadText.textContent = translations[lang].uploadCV;
        suggestedQuestions.querySelector('h3').textContent = translations[lang].suggestedQuestionsTitle;
        
        // Update suggested questions
        updateSuggestedQuestions(translations[lang].initialQuestions);
        
        // Update direction
        if (lang === 'ar') {
            document.body.classList.add('rtl');
            chatContainer.classList.add('rtl');
            enToggle.classList.remove('active');
            arToggle.classList.add('active');
        } else {
            document.body.classList.remove('rtl');
            chatContainer.classList.remove('rtl');
            enToggle.classList.add('active');
            arToggle.classList.remove('active');
        }
    }
    
    // Format message with proper paragraph structure
    function formatMessage(message) {
        if (!message) return '';
        
        // Replace newlines with <br> tags
        let formattedMessage = message.replace(/\n/g, '<br>');
        
        // Add paragraph breaks for better readability
        // Look for sentences ending with period, question mark, or exclamation mark followed by space
        formattedMessage = formattedMessage.replace(/([.?!])\s+/g, '$1</p><p>');
        
        // Wrap in paragraph tags
        formattedMessage = '<p>' + formattedMessage + '</p>';
        
        // Fix any empty paragraphs
        formattedMessage = formattedMessage.replace(/<p><\/p>/g, '<br>');
        
        // Add proper spacing for list items (numbered lists)
        formattedMessage = formattedMessage.replace(/(\d+\.)\s+/g, '<br>$1 ');
        
        return formattedMessage;
    }
    
    // Add message to chat
    function addMessage(message, isUser) {
        const messageWrapper = document.createElement('div');
        messageWrapper.className = isUser ? 'message-wrapper user-message-wrapper' : 'message-wrapper bot-message-wrapper';
        
        const avatar = document.createElement('div');
        avatar.className = isUser ? 'avatar user-avatar' : 'avatar bot-avatar';
        
        const icon = document.createElement('i');
        icon.className = isUser ? 'fas fa-user' : 'fas fa-robot';
        avatar.appendChild(icon);
        
        const messageElement = document.createElement('div');
        messageElement.className = isUser ? 'message user-message' : 'message bot-message';
        
        // Use innerHTML for bot messages to preserve formatting, textContent for user messages
        if (isUser) {
            messageElement.textContent = message;
        } else {
            messageElement.innerHTML = formatMessage(message);
        }
        
        messageWrapper.appendChild(avatar);
        messageWrapper.appendChild(messageElement);
        
        chatMessages.appendChild(messageWrapper);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // If it's a bot message, update suggested questions
        if (!isUser) {
            const newQuestions = generateSuggestedQuestions(message);
            updateSuggestedQuestions(newQuestions);
        }
    }
    
    // Validate file type and size
    function validateFile(file) {
        // Check file type - only accept PDF
        if (file.type !== 'application/pdf') {
            addMessage(translations[currentLanguage].invalidFileType, false);
            return false;
        }
        
        // Check file size - max 5MB
        if (file.size > 5 * 1024 * 1024) {
            addMessage(translations[currentLanguage].fileSizeExceeded, false);
            return false;
        }
        
        return true;
    }
    
    // Toggle between send and stop button
    function toggleSendStopButton(generating) {
        isGenerating = generating;
        
        if (generating) {
            // Change to stop button
            sendButton.innerHTML = '<i class="fas fa-stop"></i>';
            sendButton.classList.add('stop-button');
            sendButton.title = translations[currentLanguage].stopGeneration;
        } else {
            // Change back to send button
            sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
            sendButton.classList.remove('stop-button');
            sendButton.title = '';
        }
    }
    
    // Stop ongoing response generation
    function stopResponseGeneration() {
        if (controller) {
            controller.abort();
            controller = null;
            
            // Hide typing indicator
            typingIndicator.style.display = 'none';
            
            // Add message about stopping
            const stoppedMessage = currentLanguage === 'ar'
                ? "تم إيقاف الاستجابة."
                : "Response generation stopped.";
                
            addMessage(stoppedMessage, false);
            
            // Re-enable input and button
            userInput.disabled = false;
            toggleSendStopButton(false);
            userInput.focus();
        }
    }
    
    // Handle CV upload
    cvUpload.addEventListener('change', async function(e) {
        if (e.target.files.length > 0) {
            cvFile = e.target.files[0];
            
            // Validate file
            if (!validateFile(cvFile)) {
                // Reset file input
                cvUpload.value = '';
                fileName.textContent = '';
                cvFile = null;
                return;
            }
            
            fileName.textContent = cvFile.name;
            
            // Add a message about the CV upload
            const uploadMessage = currentLanguage === 'ar' 
                ? `تم تحميل السيرة الذاتية: ${cvFile.name}`
                : `CV uploaded: ${cvFile.name}`;
                
            addMessage(uploadMessage, true);
            
            // Show typing indicator
            typingIndicator.style.display = 'flex';
            
            // Add uploading message
            addMessage(translations[currentLanguage].uploadingCV, false);
            
            // Create FormData and append the file
            const formData = new FormData();
            formData.append('cv', cvFile);
            formData.append('language', currentLanguage);
            
            try {
                // Create AbortController for this request
                controller = new AbortController();
                toggleSendStopButton(true);
                
                // Send file to server
                const response = await fetch('/api/analyze-cv', {
                    method: 'POST',
                    body: formData,
                    signal: controller.signal
                });
                
                if (!response.ok) {
                    throw new Error('Server error');
                }
                
                const data = await response.json();
                
                // Hide typing indicator
                typingIndicator.style.display = 'none';
                
                // Add analyzing message (with reduced delay)
                addMessage(translations[currentLanguage].analyzingCV, false);
                
                // Show typing indicator again for analysis (with reduced delay)
                setTimeout(() => {
                    typingIndicator.style.display = 'flex';
                    
                    setTimeout(() => {
                        typingIndicator.style.display = 'none';
                        toggleSendStopButton(false);
                        
                        // Add analysis result
                        addMessage(data.analysis, false);
                    }, 1000); // Reduced from 2000ms
                }, 500); // Reduced from 1000ms
                
            } catch (error) {
                if (error.name === 'AbortError') {
                    console.log('CV upload aborted');
                } else {
                    console.error('Error uploading CV:', error);
                    
                    // Hide typing indicator
                    typingIndicator.style.display = 'none';
                    
                    // Add error message
                    addMessage(translations[currentLanguage].cvUploadError, false);
                    
                    // Reset file input
                    cvUpload.value = '';
                    fileName.textContent = '';
                    cvFile = null;
                }
                
                toggleSendStopButton(false);
            } finally {
                controller = null;
            }
        }
    });
    
    // Handle click on send/stop button
    function handleSendButtonClick() {
        if (isGenerating) {
            stopResponseGeneration();
        } else {
            sendMessage();
        }
    }
    
    // Send message
    async function sendMessage() {
        const message = userInput.value.trim();
        
        if (!message) {
            return;
        }
        
        // Add user message to chat
        addMessage(message, true);
        
        // Clear input
        userInput.value = '';
        
        // Show typing indicator
        typingIndicator.style.display = 'flex';
        
        // Disable input and change to stop button
        userInput.disabled = true;
        toggleSendStopButton(true);
        
        try {
            // Create AbortController for this request
            controller = new AbortController();
            
            // Send message to server
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    message,
                    hasCv: cvFile !== null,
                    language: currentLanguage
                }),
                signal: controller.signal
            });
            
            const data = await response.json();
            
            // Hide typing indicator
            typingIndicator.style.display = 'none';
            
            // Add bot response to chat
            addMessage(data.response, false);
            
            // Switch language if response language is different
            if (data.language && data.language !== currentLanguage) {
                switchLanguage(data.language);
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Response generation aborted');
            } else {
                console.error('Error:', error);
                
                // Hide typing indicator
                typingIndicator.style.display = 'none';
                
                // Add error message
                const errorMessage = currentLanguage === 'ar' 
                    ? "عذرًا، واجهت خطأ. يرجى المحاولة مرة أخرى لاحقًا."
                    : "Sorry, I encountered an error. Please try again later.";
                    
                addMessage(errorMessage, false);
            }
        } finally {
            // Re-enable input and change back to send button
            userInput.disabled = false;
            toggleSendStopButton(false);
            userInput.focus();
            controller = null;
        }
    }
    
    // Event listeners
    sendButton.addEventListener('click', handleSendButtonClick);
    
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            if (isGenerating) {
                stopResponseGeneration();
            } else {
                sendMessage();
            }
        }
    });
    
    enToggle.addEventListener('click', function() {
        switchLanguage('en');
    });
    
    arToggle.addEventListener('click', function() {
        switchLanguage('ar');
    });
    
    // Initialize suggested questions
    updateSuggestedQuestions(translations[currentLanguage].initialQuestions);
    
    // Focus input field on load
    userInput.focus();
});

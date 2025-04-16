require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const i18next = require('i18next');
const i18nextMiddleware = require('i18next-http-middleware');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const multer = require('multer');
const fs = require('fs');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');

// Import database connection
const { connectDB } = require('./config/database');
// Import conversation log model
const ConversationLog = require('./models/ConversationLog');
// Import admin routes
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Set up multer for file uploads - PDF only with 5MB limit
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept only PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.use(cookieParser());

// Session middleware for admin authentication
app.use(session({
  secret: process.env.SESSION_SECRET || 'saudi-career-bot-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// i18next setup for localization
i18next.use(i18nextMiddleware.LanguageDetector).init({
  detection: {
    order: ['querystring', 'cookie', 'header'],
    lookupQuerystring: 'lng',
    lookupCookie: 'i18next',
    lookupHeader: 'accept-language'
  },
  preload: ['en', 'ar'],
  fallbackLng: 'en',
  resources: {
    en: {
      translation: {
        welcomeMessage: "Hello! I'm your Career Coach Assistant specializing in the Saudi Arabian job market. I can help with career advice, job seeking strategies, interview preparation, and professional development. How can I assist you today?",
        offTopicResponse: "I'm specialized in career advice, personal development, and everything related to employment in the Saudi Arabian job market. How can I assist you with your career?",
        errorMessage: "Sorry, I encountered an error. Please try again later."
      }
    },
    ar: {
      translation: {
        welcomeMessage: "مرحباً! أنا مساعد المسار المهني المتخصص في سوق العمل السعودي. كيف يمكنني مساعدتك اليوم؟",
        offTopicResponse: "أنا متخصص في تقديم المشورة المهنية، والتطوير الشخصي، وكل ما يتعلق بالعمل في سوق العمل السعودي. هل يمكنني مساعدتك في أي استفسارات متعلقة بالمهنة أو التطوير المهني؟",
        errorMessage: "عذراً، واجهت خطأ. يرجى المحاولة مرة أخرى لاحقاً."
      }
    }
  }
});

app.use(i18nextMiddleware.handle(i18next));

// Career topics keywords for filtering - Expanded version
const careerTopics = {
  en: [
    // Original keywords
    'career', 'job', 'interview', 'resume', 'cv', 'profession', 'work',
    'employment', 'hiring', 'skill', 'salary', 'promotion', 'advancement',
    'workplace', 'office', 'colleague', 'manager', 'boss', 'leadership',
    'networking', 'linkedin', 'portfolio', 'application', 'cover letter',
    'qualification', 'experience', 'education', 'degree', 'certification',
    'training', 'mentor', 'coach', 'professional', 'industry', 'field',
    'position', 'role', 'responsibility', 'negotiation', 'remote work',
    'freelance', 'startup', 'entrepreneur', 'business', 'company',
    
    // Additional keywords for expanded scope
    'personal development', 'growth', 'soft skills', 'hard skills', 'technical skills',
    'communication', 'teamwork', 'problem solving', 'time management', 'adaptability',
    'creativity', 'emotional intelligence', 'conflict resolution', 'decision making',
    'critical thinking', 'presentation', 'public speaking', 'feedback', 'performance review',
    'goal setting', 'career path', 'career planning', 'career transition', 'career change',
    'work-life balance', 'burnout', 'stress management', 'motivation', 'productivity',
    'personal brand', 'online presence', 'networking event', 'conference', 'workshop',
    'seminar', 'webinar', 'course', 'bootcamp', 'internship', 'apprenticeship',
    'mentorship', 'coaching', 'counseling', 'guidance', 'advice', 'recommendation',
    'reference', 'background check', 'onboarding', 'probation', 'benefits', 'compensation',
    'bonus', 'incentive', 'retirement', 'pension', '401k', 'insurance', 'healthcare',
    'leave', 'vacation', 'sick day', 'remote', 'hybrid', 'flexible', 'full-time', 'part-time',
    'contract', 'permanent', 'temporary', 'seasonal', 'gig', 'side hustle', 'passive income',
    'entrepreneurship', 'startup', 'small business', 'self-employment', 'freelancing',
    'consulting', 'agency', 'corporation', 'non-profit', 'government', 'public sector',
    'private sector', 'industry', 'market', 'trend', 'forecast', 'outlook', 'demand',
    'supply', 'competition', 'advantage', 'unique selling proposition', 'value proposition'
  ],
  ar: [
    // Original keywords
    'وظيفة', 'مهنة', 'عمل', 'مقابلة', 'سيرة ذاتية', 'راتب', 'ترقية',
    'مهارات', 'تعليم', 'خبرة', 'تدريب', 'مدير', 'شركة',
    'مكان العمل', 'زملاء', 'قيادة', 'تواصل مهني', 'استكشاف',
    'طلب وظيفة', 'رسالة تغطية', 'مؤهلات', 'مسؤولية', 'تفاوض',
    'عمل عن بعد', 'عمل حر', 'ريادة أعمال',
    
    // Additional keywords for expanded scope
    'تطوير مهني', 'نمو', 'مهارات ناعمة', 'مهارات تقنية',
    'تواصل', 'عمل جماعي', 'حل مشكلات', 'إدارة الوقت', 'قدرة على التكيف',
    'إبداع', 'ذكاء عاطفي', 'حل النزاعات', 'اتخاذ القرار', 'تفكير نقدي',
    'عرض تقديمي', 'خطابة', 'تغذية راجعة', 'تقييم أداء', 'تحديد أهداف',
    'مسار وظيفي', 'تخطيط مهني', 'انتقال وظيفي', 'تغيير مهني', 'توازن الحياة',
    'إرهاق', 'إدارة التوتر', 'تحفيز', 'إنتاجية', 'علامة شخصية', 'تواجد إلكتروني',
    'فعالية تواصل', 'مؤتمر', 'ورشة عمل', 'ندوة', 'دورة', 'تدريب داخلي', 'تلمذة صناعية',
    'توجيه', 'تدريب', 'استشارة', 'مرجع', 'فحص خلفية', 'تأهيل للعمل', 'فترة تجريبية',
    'مزايا', 'تعويض', 'حوافز', 'تقاعد', 'تأمين', 'رعاية صحية',
    'إجازة', 'عطلة', 'إجازة مرضية', 'عمل عن بعد', 'عمل مختلط', 'دوام كامل',
    'دوام جزئي', 'عقد', 'دائم', 'مؤقت', 'موسمي', 'أعمال إضافية', 'شركة ناشئة',
    'مشروع صغير', 'عمل حر', 'استشارات',
    'وكالة', 'شركة', 'منظمة غير ربحية', 'حكومة', 'قطاع عام', 'قطاع خاص',
    'صناعة', 'سوق', 'اتجاه', 'توقعات', 'نظرة مستقبلية', 'طلب', 'عرض',
    'منافسة', 'ميزة', 'عرض قيمة', 'عرض فريد'
  ]
};

// Function to check if a message is career-related - More permissive version
function isCareerRelated(message, language) {
  // If the message is very short, assume it's career-related to avoid filtering out simple questions
  if (message.length < 20) return true;

  const keywords = language === 'ar' ? careerTopics.ar : careerTopics.en;
  
  // Check if any keyword is in the message
  const containsKeyword = keywords.some(keyword => 
    message.toLowerCase().includes(keyword.toLowerCase())
  );
  
  // Check for question words that might indicate a career question even without specific keywords
  const questionWords = language === 'ar' 
    ? ['كيف', 'ماذا', 'متى', 'أين', 'لماذا', 'من', 'هل', 'ما هو', 'ما هي']
    : ['how', 'what', 'when', 'where', 'why', 'who', 'can', 'should', 'could', 'would'];
    
  const containsQuestionWord = questionWords.some(word => 
    message.toLowerCase().includes(word.toLowerCase())
  );
  
  // Be more permissive - if it contains a question word or a career keyword, consider it relevant
  return containsKeyword || containsQuestionWord;
}

// API endpoint for chat
app.post('/api/chat', async (req, res) => {
  try {
    const { message, hasCv, language = 'en' } = req.body;
    
    // Check if message is career-related
    const careerRelated = isCareerRelated(message, language);
    
    let response;
    
    if (!careerRelated) {
      response = language === 'ar'
        ? "أنا متخصص في تقديم المشورة المهنية، والتطوير الشخصي، وكل ما يتعلق بالعمل في سوق العمل السعودي. هل يمكنني مساعدتك في أي استفسارات متعلقة بالمهنة أو التطوير المهني؟"
        : "I'm specialized in career advice, personal development, and everything related to employment in the Saudi Arabian job market. How can I assist you with your career?";
    } else {
      // Create system prompt based on language
      const systemPrompt = language === 'ar'
        ? "أنت مساعد للتنمية المهنية. استخدم معرفتك بسوق العمل السعودي ورؤية 2030 وتوطين الوظائف وخدمات وزارة الموارد البشرية والتنمية الاجتماعية."
        : "You are a career coach assistant specializing in the Saudi Arabian job market. You are an expert in providing career advice, job seeking strategies, interview preparation, and professional development.";
      
      // Add CV context if available
      const cvContext = hasCv
        ? (language === 'ar'
          ? "قدم نصائح مخصصة حول كيفية تحسين السيرة الذاتية وجعلها أكثر جاذبية لأصحاب العمل في سوق العمل السعودي."
          : "The user has uploaded their CV. Provide tailored advice on how to improve the CV and make it more attractive to employers in the Saudi job market.")
        : "";
      
      // Generate response using Gemini API
      const result = await model.generateContent({
        contents: [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "model", parts: [{ text: "I understand. I'll provide expert advice on career development, job seeking strategies, interview preparation, and professional development in the Saudi Arabian job market. I'll consider Vision 2030 initiatives, Saudization policies, and relevant resources from the Ministry of Human Resources and Social Development." }] },
          { role: "user", parts: [{ text: `${cvContext} The user is asking about: ${message}. Provide a helpful, detailed response.` }] }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000, // Increased token limit for more detailed responses
        },
      });

      response = result.response.text();
    }

    // Generate a session ID if it doesn't exist
    const sessionId = req.cookies.sessionId || uuidv4();
    
    // Set session cookie if it doesn't exist
    if (!req.cookies.sessionId) {
      res.cookie('sessionId', sessionId, { 
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true 
      });
    }
    
    // Log conversation to MongoDB if connected
    try {
      await ConversationLog.create({
        language,
        userMessage: message,
        botResponse: response,
        isCareerRelated: careerRelated,
        hasCvContext: !!hasCv,
        sessionId,
        metadata: {
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
          referrer: req.headers.referer || ''
        }
      });
    } catch (dbError) {
      console.error('Error logging conversation to MongoDB:', dbError);
      // Continue even if logging fails
    }

    res.json({ response, language });
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = req.body.language === 'ar' 
      ? "عذراً، واجهت خطأ. يرجى المحاولة مرة أخرى لاحقاً."
      : "Sorry, I encountered an error. Please try again later.";
    res.status(500).json({ response: errorMessage });
  }
});

// API endpoint for CV upload and analysis
app.post('/api/analyze-cv', upload.single('cv'), async (req, res) => {
  try {
    const { language = 'en' } = req.body;
    const file = req.file;
    
    if (!file) {
      const errorMessage = language === 'ar'
        ? "لم يتم تحميل أي ملف. يرجى تحميل سيرتك الذاتية بتنسيق PDF."
        : "No file uploaded. Please upload your CV in PDF format.";
      return res.status(400).json({ error: errorMessage });
    }
    
    // Here you would typically extract text from the CV file
    // For this example, we'll simulate CV analysis
    
    // Simulate CV content (in a real implementation, you would extract text from the file)
    const simulatedCvContent = "John Doe\nSoftware Engineer\n5 years experience\nSkills: JavaScript, React, Node.js\nEducation: Bachelor's in Computer Science";
    
    // Generate analysis using Gemini API
    const cvAnalysisPrompt = language === 'ar'
      ? "محلل السيرة الذاتية السعودي. قم بتحليل هذه السيرة الذاتية وتقديم توصيات مفصلة لتحسينها بناءً على متطلبات سوق العمل السعودي."
      : "You are a CV analyst specializing in the Saudi Arabian job market. Analyze this CV and provide detailed recommendations for improvement based on Saudi job market requirements.";
    
    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: cvAnalysisPrompt }] },
        { role: "model", parts: [{ text: "I'll analyze this CV and provide detailed recommendations for improvement based on Saudi job market requirements." }] },
        { role: "user", parts: [{ text: `CV Content: ${simulatedCvContent}\n\nPlease provide a comprehensive analysis with specific recommendations for improvement to make this CV more attractive to employers in the Saudi job market.` }] }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    });
    
    const analysis = result.response.text();
    
    // Clean up the uploaded file
    fs.unlinkSync(file.path);
    
    res.json({ analysis });
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = req.body.language === 'ar' 
      ? "عذراً، واجهت خطأ. يرجى المحاولة مرة أخرى لاحقاً."
      : "Sorry, I encountered an error. Please try again later.";
    res.status(500).json({ error: errorMessage });
  }
});

// Mount admin routes
app.use('/hadidi82', adminRoutes);

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

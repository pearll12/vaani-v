// lib/chatbot.js

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिंदी' },
  { code: 'ta', name: 'தமிழ்' },
  { code: 'gu', name: 'ગુજરાતી' },
]

// Text-to-speech using Web Speech API
export function speakText(text, lang = 'en') {
  if (!window.speechSynthesis) return
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang === 'en' ? 'en-IN' : lang === 'hi' ? 'hi-IN' : lang === 'ta' ? 'ta-IN' : 'gu-IN'
  utterance.rate = 0.9
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}

export const CHATBOT_GUIDES = {
  en: {
    name: 'BusinessVaani Assistant',
    welcome: "👋 Namaste! I'm your BusinessVaani assistant. I can explain every feature of this dashboard, guide you on how to use Khata, Payments, Orders, Reminders, and more. What would you like to know?",
    inputPlaceholder: 'Ask me anything...',
    restartLabel: 'Restart',
    restartConfirm: 'Conversation restarted. How can I help you today?',
    fallback: "I'm not sure about that. You can ask me about: Khata (credit ledger), Payments, Orders, Reminders, Invoices, or Reports. Type 'help' for options.",
    quickActions: {
      khata: '📒 Khata / Udhaar',
      payments: '💰 Payments',
      orders: '📦 Orders',
      reminders: '⏰ Reminders',
      faq: '❓ Common Questions'
    },
    quickLabels: {
      khata: 'Tell me about Khata',
      payments: 'Explain Payments',
      orders: 'How do Orders work?',
      reminders: 'Tell me about Reminders',
      faq: 'I have a common question'
    },
    features: {
      khata: `📒 **Khata (Udhaar Ledger)** – Automatically tracks credit given to customers.  
• See total outstanding amount.  
• Each customer's balance, order history, and collection percentage.  
• Send WhatsApp reminders directly from the Khata page.  
• High-risk customers (balance > ₹5000) are highlighted in red.  
• Use the "Remind" button to nudge customers to pay.`,
      payments: `💰 **Payments Page** – Real‑time sync with Razorpay.  
• View all orders in a Kanban board: Pending → Invoiced → Paid.  
• Mark an order as paid manually (webhook also auto-updates).  
• Send payment reminders to customers who haven't paid.  
• See total collected amount and pending value including GST.  
• Payments reflect automatically when customer pays via Razorpay link.`,
      orders: `📦 **Orders** – All customer orders from WhatsApp are stored here.  
• Each order has items, quantities, total amount, and GST.  
• Status: pending → invoiced → paid.  
• You can generate invoices and send them to customers.  
• Orders are automatically linked to Khata for credit tracking.`,
      reminders: `⏰ **Reminders** – Send automatic or manual reminders.  
• From Khata page: one‑click reminder to any customer with outstanding balance.  
• From Payments page: reminder for a specific unpaid order.  
• Reminders are sent via WhatsApp message with payment link.  
• Keeps track of reminder count to avoid spamming.`,
      reports: `📊 **Reports & Analytics** – Coming soon! You'll be able to see sales trends, recovery rates, and customer payment behaviour.`
    },
    faq: {
      howTo: `🔧 **How to use this dashboard:**  
1. **Khata** – Check who owes money, send reminders.  
2. **Payments** – Track order status, mark paid, collect money.  
3. **Orders** – View all incoming orders from WhatsApp.  
4. **Reminders** – Use buttons on Khata/Payments pages.  
Just click on any card or button to perform actions.`,
      common: `❓ **Common Questions**  
**Q: How do I send a reminder?**  
A: Go to Khata page → find customer → click "Remind" button.  
**Q: How do I mark an order as paid?**  
A: Payments page → find order in "Invoiced" column → click "Mark paid".  
**Q: Does it automatically calculate Udhaar?**  
A: Yes! When an order is marked paid, Khata updates automatically.  
**Q: Can I use it on mobile?**  
A: Yes, the dashboard is fully responsive.  
**Q: How to change language?**  
A: Click the language buttons at the top of this chat.`
    }
  },
  hi: {
    name: 'बिजनेसवाणी सहायक',
    welcome: "👋 नमस्ते! मैं आपका बिजनेसवाणी सहायक हूँ। मैं इस डैशबोर्ड के हर फीचर को समझा सकता हूँ: खाता, पेमेंट, ऑर्डर, रिमाइंडर। आप क्या जानना चाहेंगे?",
    inputPlaceholder: 'कुछ भी पूछें...',
    restartLabel: 'पुनः प्रारंभ',
    restartConfirm: 'बातचीत फिर से शुरू हुई। मैं आपकी कैसे मदद कर सकता हूँ?',
    fallback: "मुझे इसका जवाब नहीं पता। आप पूछ सकते हैं: खाता, पेमेंट, ऑर्डर, रिमाइंडर, या इनवॉइस। 'मदद' टाइप करें।",
    quickActions: {
      khata: '📒 खाता / उधार',
      payments: '💰 पेमेंट',
      orders: '📦 ऑर्डर',
      reminders: '⏰ रिमाइंडर',
      faq: '❓ सामान्य प्रश्न'
    },
    quickLabels: {
      khata: 'खाता के बारे में बताएं',
      payments: 'पेमेंट समझाएं',
      orders: 'ऑर्डर कैसे काम करते हैं?',
      reminders: 'रिमाइंडर के बारे में बताएं',
      faq: 'मेरा एक सामान्य सवाल है'
    },
    features: {
      khata: `📒 **खाता (उधार लेज़र)** – ग्राहकों को दिए गए उधार का ऑटो ट्रैकिंग।  
• कुल बकाया राशि देखें।  
• हर ग्राहक का बैलेंस, ऑर्डर हिस्ट्री और कलेक्शन प्रतिशत।  
• खाता पेज से सीधे व्हाट्सएप रिमाइंडर भेजें।  
• हाई-रिस्क ग्राहक (₹5000 से अधिक) लाल रंग में दिखेंगे।  
• "रिमाइंडर" बटन से पैसे मांगने का संदेश भेजें।`,
      payments: `💰 **पेमेंट पेज** – रेजरपे से रीयल-टाइम सिंक।  
• सभी ऑर्डर कानबान बोर्ड में देखें: पेंडिंग → इनवॉइस्ड → पेड।  
• मैन्युअली पेड मार्क करें (वेबहुक भी ऑटो अपडेट करता है)।  
• अनपेड ऑर्डर के लिए रिमाइंडर भेजें।  
• कुल कलेक्टेड राशि और जीएसटी सहित बकाया देखें।  
• ग्राहक के रेजरपे लिंक से भुगतान करने पर अपडेट होगा।`,
      orders: `📦 **ऑर्डर** – व्हाट्सएप से सभी ग्राहक ऑर्डर यहाँ स्टोर होते हैं।  
• हर ऑर्डर में आइटम, मात्रा, कुल राशि और जीएसटी।  
• स्टेटस: पेंडिंग → इनवॉइस्ड → पेड।  
• इनवॉइस जनरेट करें और ग्राहक को भेजें।  
• ऑर्डर खाता पेज से लिंक होते हैं।`,
      reminders: `⏰ **रिमाइंडर** – ऑटो या मैन्युअल रिमाइंडर भेजें।  
• खाता पेज से: किसी भी ग्राहक को एक क्लिक में रिमाइंडर।  
• पेमेंट पेज से: किसी विशेष ऑर्डर के लिए रिमाइंडर।  
• रिमाइंडर व्हाट्सएप पर पेमेंट लिंक के साथ जाता है।  
• बार-बार न भेजने के लिए काउंट रखता है।`,
      reports: `📊 **रिपोर्ट्स** – जल्द आ रहा है! बिक्री के रुझान, रिकवरी दर, ग्राहक भुगतान व्यवहार।`
    },
    faq: {
      howTo: `🔧 **डैशबोर्ड का उपयोग कैसे करें:**  
1. **खाता** – देखें किस पर कितना बकाया है, रिमाइंडर भेजें।  
2. **पेमेंट** – ऑर्डर स्टेटस देखें, पेड मार्क करें, पैसे इकट्ठा करें।  
3. **ऑर्डर** – व्हाट्सएप से आए सभी ऑर्डर देखें।  
4. **रिमाइंडर** – खाता/पेमेंट पेज पर बटन का उपयोग करें।  
बस किसी भी कार्ड या बटन पर क्लिक करें।`,
      common: `❓ **सामान्य प्रश्न**  
**प्रश्न: रिमाइंडर कैसे भेजें?**  
उत्तर: खाता पेज पर जाएँ → ग्राहक ढूंढें → "रिमाइंडर" बटन क्लिक करें।  
**प्रश्न: ऑर्डर को पेड कैसे मार्क करें?**  
उत्तर: पेमेंट पेज → "इनवॉइस्ड" कॉलम में ऑर्डर ढूंढें → "Mark paid" क्लिक करें।  
**प्रश्न: क्या उधार ऑटो कैलकुलेट होता है?**  
उत्तर: हाँ! जब ऑर्डर पेड मार्क होगा, खाता अपडेट हो जाएगा।  
**प्रश्न: क्या मोबाइल पर चल सकता है?**  
उत्तर: हाँ, पूरी तरह रिस्पॉन्सिव है।  
**प्रश्न: भाषा कैसे बदलें?**  
उत्तर: इस चैट के ऊपर भाषा बटन क्लिक करें।`
    }
  },
  // Tamil (தமிழ்) – same structure, keep concise
  ta: {
    name: 'பிசினஸ்வாணி உதவியாளர்',
    welcome: "👋 வணக்கம்! நான் உங்கள் பிசினஸ்வாணி உதவியாளர். கட்டா, பேமென்ட், ஆர்டர்கள், நினைவூட்டல்கள் அனைத்தையும் விளக்க முடியும். என்ன தெரிந்துகொள்ள விரும்புகிறீர்கள்?",
    inputPlaceholder: 'ஏதாவது கேளுங்கள்...',
    restartLabel: 'மீண்டும் தொடங்கு',
    restartConfirm: 'உரையாடல் மீண்டும் தொடங்கப்பட்டது. எவ்வாறு உதவலாம்?',
    fallback: "எனக்கு புரியவில்லை. கட்டா, பேமென்ட், ஆர்டர், ரிமைண்டர் பற்றி கேளுங்கள். 'உதவி' தட்டச்சு செய்யவும்.",
    quickActions: {
      khata: '📒 கட்டா / உதார்',
      payments: '💰 பணம் செலுத்துதல்',
      orders: '📦 ஆர்டர்கள்',
      reminders: '⏰ நினைவூட்டல்கள்',
      faq: '❓ பொதுவான கேள்விகள்'
    },
    quickLabels: {
      khata: 'கட்டா பற்றி விளக்கு',
      payments: 'பேமென்ட் விளக்கு',
      orders: 'ஆர்டர்கள் எப்படி வேலை செய்கிறது?',
      reminders: 'ரிமைண்டர் பற்றி விளக்கு',
      faq: 'எனக்கு ஒரு பொதுவான கேள்வி'
    },
    features: {
      khata: `📒 **கட்டா (உதார் லெட்ஜர்)** – வாடிக்கையாளர்களுக்கு கொடுக்கப்பட்ட உதார் தானாக கண்காணிக்கும்.  
• மொத்த நிலுவைத் தொகை.  
• ஒவ்வொரு வாடிக்கையாளரின் இருப்பு, ஆர்டர் வரலாறு, வசூல் சதவீதம்.  
• கட்டா பக்கத்திலிருந்து நேரடியாக வாட்ஸ்அப்பில் நினைவூட்டல் அனுப்பு.  
• அதிக ஆபத்துள்ள வாடிக்கையாளர்கள் (₹5000+ சிவப்பில்).  
• "ரிமைண்டர்" பொத்தான் மூலம் பணம் கேட்டு செய்தி அனுப்பு.`,
      payments: `💰 **பேமென்ட் பக்கம்** – ரேஸர்பே உடன் நிகழ்நேர ஒத்திசைவு.  
• அனைத்து ஆர்டர்களும் கான்பன் பலகையில்: நிலுவை → விலைப்பட்டுவாடி → செலுத்தப்பட்டது.  
• கைமுறையாக "செலுத்தப்பட்டது" எனக் குறிக்கவும்.  
• செலுத்தப்படாத ஆர்டர்களுக்கு நினைவூட்டல் அனுப்பு.  
• ஜிஎஸ்டி உட்பட மொத்த வசூல் மற்றும் நிலுவைத் தொகை.`,
      orders: `📦 **ஆர்டர்கள்** – வாட்ஸ்அப்பிலிருந்து வரும் அனைத்து ஆர்டர்களும் இங்கே சேமிக்கப்படும்.  
• ஒவ்வொரு ஆர்டரிலும் பொருட்கள், அளவு, மொத்தத் தொகை மற்றும் ஜிஎஸ்டி.  
• நிலை: நிலுவை → விலைப்பட்டுவாடி → செலுத்தப்பட்டது.`,
      reminders: `⏰ **நினைவூட்டல்கள்** – தானியங்கி அல்லது கைமுறை நினைவூட்டல்கள்.  
• கட்டா பக்கத்திலிருந்து: எந்த வாடிக்கையாளருக்கும் ஒரு கிளிக்கில் நினைவூட்டல்.  
• பேமென்ட் பக்கத்திலிருந்து: ஒரு குறிப்பிட்ட ஆர்டருக்கு நினைவூட்டல்.`
    },
    faq: {
      howTo: `🔧 **இந்த டாஷ்போர்டை எவ்வாறு பயன்படுத்துவது:**  
1. **கட்டா** – யார் எவ்வளவு நிலுவையில் உள்ளனர், நினைவூட்டல் அனுப்பு.  
2. **பேமென்ட்** – ஆர்டர் நிலையைப் பார், "செலுத்தப்பட்டது" எனக் குறி, பணத்தை வசூலி.  
3. **ஆர்டர்கள்** – வாட்ஸ்அப்பிலிருந்து வரும் அனைத்து ஆர்டர்களையும் பார்.  
4. **ரிமைண்டர்** – கட்டா/பேமென்ட் பக்கங்களில் பொத்தான்களைப் பயன்படுத்து.`,
      common: `❓ **பொதுவான கேள்விகள்**  
**கே: நினைவூட்டலை எவ்வாறு அனுப்புவது?**  
ப: கட்டா பக்கம் → வாடிக்கையாளரைக் கண்டுபிடி → "ரிமைண்டர்" பொத்தானை அழுத்து.  
**கே: ஆர்டரை "செலுத்தப்பட்டது" என எப்படிக் குறிப்பது?**  
ப: பேமென்ட் பக்கம் → "இன்வாய்ஸ்" பிரிவில் ஆர்டரைக் கண்டுபிடி → "Mark paid" அழுத்து.`
    }
  },
  // Gujarati (ગુજરાતી)
  gu: {
    name: 'બિઝનેસવાણી સહાયક',
    welcome: "👋 નમસ્તે! હું તમારો બિઝનેસવાણી સહાયક છું. ખાતું, પેમેન્ટ, ઓર્ડર, રિમાઇન્ડર - બધા ફીચર સમજાવી શકું છું. શું જાણવા માગો છો?",
    inputPlaceholder: 'કંઈપણ પૂછો...',
    restartLabel: 'ફરી શરૂ કરો',
    restartConfirm: 'વાતચીત ફરી શરૂ થઈ. હું કેવી રીતે મદદ કરી શકું?',
    fallback: "મને સમજાયું નહીં. ખાતું, પેમેન્ટ, ઓર્ડર, રિમાઇન્ડર વિશે પૂછો. 'મદદ' ટાઈપ કરો.",
    quickActions: {
      khata: '📒 ખાતું / ઉધાર',
      payments: '💰 ચુકવણી',
      orders: '📦 ઓર્ડર',
      reminders: '⏰ રિમાઇન્ડર',
      faq: '❓ સામાન્ય પ્રશ્નો'
    },
    quickLabels: {
      khata: 'ખાતા વિશે સમજાવો',
      payments: 'પેમેન્ટ સમજાવો',
      orders: 'ઓર્ડર કેવી રીતે કામ કરે છે?',
      reminders: 'રિમાઇન્ડર સમજાવો',
      faq: 'મારો એક સામાન્ય પ્રશ્ન છે'
    },
    features: {
      khata: `📒 **ખાતું (ઉધાર લેજર)** – ગ્રાહકોને આપેલા ઉધારનો ઓટો ટ્રેકિંગ.  
• કુલ બાકી રકમ.  
• દરેક ગ્રાહકનું બેલેન્સ, ઓર્ડર હિસ્ટ્રી અને કલેક્શન ટકા.  
• ખાતા પેજથી સીધો વોટ્સએપ રિમાઇન્ડર મોકલો.  
• હાઈ-રિસ્ક ગ્રાહકો (₹5000+ લાલ રંગમાં).  
• "રિમાઇન્ડર" બટનથી પૈસા માંગવાનો સંદેશ મોકલો.`,
      payments: `💰 **પેમેન્ટ પેજ** – રેઝરપે સાથે રીયલ-ટાઈમ સિંક.  
• બધા ઓર્ડર કાનબાન બોર્ડમાં: બાકી → ઇનવોઇસ્ડ → ચૂકવેલ.  
• મેન્યુઅલી "ચૂકવેલ" માર્ક કરો.  
• અનપેડ ઓર્ડર માટે રિમાઇન્ડર મોકલો.  
• જીએસટી સહિત કુલ કલેક્ટેડ રકમ અને બાકી રકમ.`,
      orders: `📦 **ઓર્ડર** – વોટ્સએપથી આવતા બધા ઓર્ડર અહીં સ્ટોર થાય છે.  
• દરેક ઓર્ડરમાં આઇટમ્સ, જથ્થો, કુલ રકમ અને જીએસટી.  
• સ્ટેટસ: બાકી → ઇનવોઇસ્ડ → ચૂકવેલ.`,
      reminders: `⏰ **રિમાઇન્ડર** – ઓટો અથવા મેન્યુઅલ રિમાઇન્ડર મોકલો.  
• ખાતા પેજથી: કોઈપણ ગ્રાહકને એક ક્લિકમાં રિમાઇન્ડર.  
• પેમેન્ટ પેજથી: કોઈ ચોક્કસ ઓર્ડર માટે રિમાઇન્ડર.`
    },
    faq: {
      howTo: `🔧 **ડેશબોર્ડનો ઉપયોગ કેવી રીતે કરવો:**  
1. **ખાતું** – જુઓ કોના પર કેટલું બાકી છે, રિમાઇન્ડર મોકલો.  
2. **પેમેન્ટ** – ઓર્ડર સ્ટેટસ જુઓ, ચૂકવેલ માર્ક કરો, પૈસા એકત્ર કરો.  
3. **ઓર્ડર** – વોટ્સએપથી આવતા બધા ઓર્ડર જુઓ.  
4. **રિમાઇન્ડર** – ખાતા/પેમેન્ટ પેજ પરના બટનો વાપરો.`,
      common: `❓ **સામાન્ય પ્રશ્નો**  
**પ્ર: રિમાઇન્ડર કેવી રીતે મોકલવું?**  
જ: ખાતા પેજ → ગ્રાહક શોધો → "રિમાઇન્ડર" બટન દબાવો.  
**પ્ર: ઓર્ડરને "ચૂકવેલ" કેવી રીતે માર્ક કરવો?**  
જ: પેમેન્ટ પેજ → "ઇનવોઇસ્ડ" કોલમમાં ઓર્ડર શોધો → "Mark paid" દબાવો.`
    }
  }
}
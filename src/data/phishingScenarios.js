// תרחישי פישינג לסימולציה
export const phishingScenarios = [
  {
    id: "ms365_account_verify",
    type: "email",
    difficulty: 2,
    time_limit: 45,
    content: {
      sender: {
        name: "Microsoft 365",
        email: "security@microsoft365-verify.com"
      },
      subject: "אימות חשבון Microsoft 365 נדרש",
      body: `משתמש יקר,

זיהינו פעילות חריגה בחשבון Microsoft 365 שלך.
כדי להבטיח את אבטחת החשבון שלך, עליך לאמת את פרטי החשבון בהקדם.

לחץ כאן לאימות החשבון שלך

אם לא תאמת את החשבון תוך 24 שעות, החשבון יושהה.

בברכה,
צוות האבטחה של Microsoft`,
      suspicious_elements: [
        {
          type: "sender_email",
          detail: "דומיין לא רשמי של Microsoft",
          points: 25
        },
        {
          type: "urgency",
          detail: "יצירת תחושת דחיפות ואיום",
          points: 20
        },
        {
          type: "generic_greeting",
          detail: "פנייה כללית במקום שם ספציפי",
          points: 15
        },
        {
          type: "link",
          detail: "קישור חשוד שמוביל לאתר לא מאומת",
          points: 20
        }
      ],
      correct_actions: [
        {
          action: "דיווח על הודעת פישינג",
          points: 30,
          feedback: "נכון מאוד! חשוב לדווח על הודעות פישינג כדי להגן על משתמשים אחרים."
        },
        {
          action: "מחיקת ההודעה",
          points: 20,
          feedback: "נכון! הודעות חשודות יש למחוק מיד."
        },
        {
          action: "בדיקת כתובת האימייל של השולח",
          points: 25,
          feedback: "מצוין! תמיד חשוב לבדוק את כתובת השולח."
        }
      ],
      wrong_actions: [
        {
          action: "לחיצה על הקישור",
          penalty: -40,
          feedback: "זו פעולה מסוכנת! אין ללחוץ על קישורים חשודים."
        },
        {
          action: "הזנת פרטי התחברות",
          penalty: -50,
          feedback: "לעולם אין להזין פרטי התחברות בתגובה להודעת אימייל!"
        }
      ],
      educational_tips: [
        "Microsoft לעולם לא תבקש ממך לאמת את החשבון דרך אימייל",
        "תמיד בדקו את כתובת האימייל של השולח",
        "היזהרו מהודעות שיוצרות תחושת דחיפות",
        "אם יש ספק - פנו ישירות לתמיכה של Microsoft"
      ]
    }
  },
  {
    id: "ms365_storage_alert",
    type: "email",
    difficulty: 2,
    time_limit: 45,
    content: {
      sender: {
        name: "Microsoft 365 Storage",
        email: "storage-alert@microsft-365.com"
      },
      subject: "אזהרה דחופה: חריגה ממכסת האחסון שלך",
      body: `שלום [שם המשתמש],

מערכת Microsoft 365 זיהתה שחרגת מ-90% ממכסת האחסון שלך.
עליך לפעול מיד כדי למנוע אובדן נתונים.

פעולות נדרשות:
1. לחץ על הכפתור למטה לאימות החשבון שלך
2. אשר את הגדלת נפח האחסון
3. המשך לעבוד ללא הפרעה

[כפתור: הגדל נפח אחסון עכשיו]

הודעה זו תקפה ל-24 שעות בלבד.

בברכה,
צוות Microsoft 365`,
      suspicious_elements: [
        {
          type: "sender_email",
          detail: "שגיאת כתיב בדומיין: microsft במקום microsoft",
          points: 25
        },
        {
          type: "urgency",
          detail: "יצירת תחושת דחיפות עם הגבלת זמן",
          points: 20
        },
        {
          type: "generic_greeting",
          detail: "פנייה כללית במקום שם ספציפי",
          points: 15
        },
        {
          type: "bad_grammar",
          detail: "שגיאות דקדוק קלות בטקסט העברי",
          points: 15
        },
        {
          type: "hover_link",
          detail: "כתובת URL חשודה בלינק",
          points: 25
        }
      ],
      correct_actions: [
        {
          action: "report_phishing",
          points: 50,
          feedback: "נכון מאוד! דיווח על הודעות חשודות עוזר להגן על כולם"
        },
        {
          action: "delete_email",
          points: 30,
          feedback: "טוב! מחיקת הודעות חשודות היא צעד נכון"
        }
      ],
      wrong_actions: [
        {
          action: "click_link",
          penalty: -50,
          feedback: "זהירות! לעולם אין ללחוץ על לינקים חשודים"
        },
        {
          action: "enter_credentials",
          penalty: -100,
          feedback: "סכנה! לעולם אין להזין פרטי התחברות בדפים לא מאומתים"
        }
      ],
      educational_tips: [
        "תמיד בדקו את כתובת השולח בקפידה",
        "היזהרו מהודעות היוצרות תחושת דחיפות",
        "Microsoft לעולם לא תבקש ממך להזין פרטים דרך אימייל",
        "בדקו את ה-URL האמיתי על ידי ריחוף מעל הלינק (hover)",
        "אם יש ספק - פנו ישירות לתמיכה הטכנית"
      ]
    }
  }
  // ניתן להוסיף תרחישים נוספים כאן
];

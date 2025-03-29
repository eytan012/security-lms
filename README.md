# Security LMS - מערכת למידה לאבטחת מידע

מערכת למידה מקוונת המתמקדת באבטחת מידע ומודעות לסייבר.

## התקנה

1. התקן את Node.js (גרסה 14 ומעלה)
2. שכפל את המאגר:
   ```bash
   git clone https://github.com/your-username/security-lms.git
   cd security-lms
   ```
3. התקן את התלויות:
   ```bash
   npm install
   ```
4. צור קובץ `.env` בתיקיית הפרויקט והוסף את המשתנים הבאים:
   ```
   REACT_APP_FIREBASE_API_KEY=your-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   REACT_APP_FIREBASE_APP_ID=your-app-id
   REACT_APP_FIREBASE_MEASUREMENT_ID=your-measurement-id
   ```
5. הרץ את האפליקציה במצב פיתוח:
   ```bash
   npm start
   ```

## פריסה לFirebase

1. התקן את Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. התחבר לFirebase:
   ```bash
   firebase login
   ```

3. אתחל את הפרויקט:
   ```bash
   firebase init
   ```
   - בחר Hosting
   - בחר את הפרויקט שלך
   - הגדר את תיקיית `build` כתיקיית הפריסה
   - הגדר SPA כ-true
   - אל תדרוס את index.html

4. בנה את האפליקציה:
   ```bash
   npm run build
   ```

5. פרוס את האפליקציה:
   ```bash
   firebase deploy
   ```

## תחזוקה

1. העלאה לגיט:
   ```bash
   git add .
   git commit -m "תיאור השינויים"
   git push origin main
   ```

2. עדכון גרסה:
   ```bash
   npm version patch
   git push && git push --tags
   ```

## מבנה הפרויקט

```
src/
  ├── components/     # רכיבי React משותפים
  ├── context/       # Context API
  ├── data/         # מידע דמה וקבועים
  ├── firebase/     # הגדרות Firebase
  ├── hooks/        # Custom Hooks
  ├── pages/        # דפי האפליקציה
  └── styles/       # סגנונות CSS
```
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

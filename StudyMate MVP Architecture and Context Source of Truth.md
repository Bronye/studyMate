## **StudyMate MVP: The "Source of Truth" Context File**

### **1\. The Core Philosophy**

* **Mission:** Transform the Nigerian curriculum from a "chore" into a "quest" using AI-driven personalization and offline-first accessibility.  
* **Target:** SSS 1-3 (Nigeria) with a focus on the 2025/26 NERDC streamlined subjects.  
* **Tone:** Supportive, Gamified (Duolingo-style), and Predictive.

### **2\. UI/UX Master Specs (The "Stitch" Standards)**

* **Visual Language:** "Naija-Modern." High-saturation accents (Emerald, Violet, Coral) on neutral bases.  
* **The Anti-Menu:** No sidebars. Use a vertical "Quest Map" for the curriculum and a persistent "Hero" Camera Button for Note-to-Quiz.  
* **Micro-Interactions:** \* Use Framer Motion for "squishy" buttons and layout morphing.  
  * Implement "Skeleton Screens" during OCR/AI processing to maintain the "perceived speed" of the app.  
* **Emotional UI:** The "Psychometric Avatar" must evolve visually as the student progresses or changes their study habits.

### **3\. The Logic Pipeline (Kilo Code Special)**

* **The "Persona" Injection:** Every AI prompt must be prefixed with: *“System: Acting as a \[Persona Type\] mentor for a \[Cognitive Profile\] student in the Nigerian SSS \[Level\] curriculum. Tone: \[Encouraging/Direct/Analytic based on EQ baseline\].”*  
* **Multimodal OCR:** Use Google Cloud Vision to capture not just text, but the *spatial layout* of handwritten notes (diagrams, underlines, bullet points) to inform the quiz structure.  
* **The "Local Brain" (Offline Strategy):**  
  * **Priority 1:** Sync the "Psychometric DNA" first.  
  * **Priority 2:** Download 5 JSON Quizzes based on the student's *weakest* curriculum topics.  
  * **Priority 3:** Queue any offline "Level Ups" or "XP gains" for immediate sync when navigator.onLine is true.

### **4\. Technical Stack Constraints**

* **Frontend:** React \+ Vite (PWA).  
* **Storage:** IndexedDB (via Dexie.js).  
* **AI:** Gemini 2.5 Flash (for 1M token context & speed).  
* **Backend:** FastAPI/Express \+ PostgreSQL (Supabase) for curriculum delivery.

### **5\. Future Scalability (Built-in)**

* **Curriculum Modularization:** Store the Nigerian curriculum in a standalone JSON schema so it can be swapped for IB or UK curricula without refactoring the core engine.  
* **The "Teacher Portal" Hook:** Ensure the database schema for scores includes concept\_tag and difficulty\_level to allow for future class-wide analytics.

Focus on the **(Onboarding),** and the **"Note-to-Quiz" pipeline** first. These are the "Magic Moments" that will make the user fall in love with the app. If the note-taking to quiz generation feels like magic, the rest of the app's success is guaranteed.
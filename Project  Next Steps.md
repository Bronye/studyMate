Now that the "Skeletal" design is done, you needs to build the **"Neural Pathways"** of the app. follow this priority order:

1. **Phase 1: The "Offline-First" Data Vault:**  
   * Build the Dexie.js (IndexedDB) schemas.  
   * **The Goal:** Even before the AI is hooked up, the app should be able to load a hardcoded JSON quiz and "play" it without an internet connection. If this doesn't work perfectly, the "rural student" use case fails.  
2. **Phase 2: The "Handwriting-to-JSON" Bridge:**  
   * Integrate the Google Cloud Vision OCR with the Gemini 2.5 Flash API.  
   * **The PRO Tip:** implement a "Partial Success" state. If the handwriting is too messy for 100% accuracy, the AI should say: *"I caught most of this, but can you double-check the part about \[Topic\]?"* This builds user trust instead of just failing.  
3. **Phase 3: The NERDC Subject Injection:**  
   * populate the backend with the "Core 5" subjects of the **2025/26 Nigerian Curriculum** (English, Maths, Trade, Citizenship & Heritage, and Digital Tech).  
   * **Logic:** "Citizenship & Heritage" is the new merged subject (History \+ Civic \+ Social Studies).
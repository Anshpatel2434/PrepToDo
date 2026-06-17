export interface FAQItem {
    id: string;
    question: string;
    answer: string;
    category: 'exam' | 'rc' | 'va' | 'preptodo';
}

export const FAQ_CATEGORIES = [
    { id: 'all', label: 'All FAQs' },
    { id: 'exam', label: 'CAT & VARC Exam' },
    { id: 'rc', label: 'Reading Comprehension' },
    { id: 'va', label: 'Verbal Ability' },
    { id: 'preptodo', label: 'PrepToDo AI Platform' }
];

export const FAQ_DATA: FAQItem[] = [
    // --- CAT & VARC Exam ---
    {
        id: 'exam-1',
        question: 'What is the structure of the CAT VARC section?',
        answer: 'The CAT VARC section consists of 24 questions to be answered in 40 minutes, carrying 72 marks. It typically includes 16 Reading Comprehension questions (4 passages) and 8 Verbal Ability questions.',
        category: 'exam'
    },
    {
        id: 'exam-2',
        question: 'Is there negative marking in the CAT VARC section?',
        answer: 'Yes, multiple-choice questions (MCQs) carry a negative marking of -1 for every incorrect answer. However, Type-In-The-Answer (TITA) questions do not have negative marking.',
        category: 'exam'
    },
    {
        id: 'exam-3',
        question: 'What is a good score in CAT VARC to get a 99+ percentile?',
        answer: 'Typically, a raw score of 35-40 marks (out of 72) is sufficient to secure a 99+ percentile in the CAT VARC section. This requires answering 12-14 questions with high accuracy.',
        category: 'exam'
    },
    {
        id: 'exam-4',
        question: 'How are sectional cut-offs determined in CAT VARC?',
        answer: 'IIMs and top business schools set individual sectional cut-offs (typically 80-85 percentile) for VARC. Failing to clear this sectional cut-off disqualifies you from their selection process, regardless of your overall CAT score.',
        category: 'exam'
    },
    {
        id: 'exam-5',
        question: 'Can I switch sections during the CAT exam?',
        answer: 'No, the CAT exam has a strict sectional time limit of 40 minutes per section. You cannot switch to another section or view other sections until the timer for the current section expires.',
        category: 'exam'
    },
    {
        id: 'exam-6',
        question: 'How does the CAT VARC syllabus differ from other management exams like XAT or SNAP?',
        answer: 'While CAT focuses heavily on Reading Comprehension and contextual logic, XAT includes Decision Making and business terminology, and SNAP tests speed-based grammar and vocabulary. PrepToDo helps students bridge this gap by offering personalized, multi-exam analysis.',
        category: 'exam'
    },
    // --- Reading Comprehension ---
    {
        id: 'rc-1',
        question: 'How many RC passages are there in the CAT exam?',
        answer: 'The CAT VARC section generally contains 4 Reading Comprehension passages, each followed by 4 questions, making a total of 16 RC questions.',
        category: 'rc'
    },
    {
        id: 'rc-2',
        question: 'What is the ideal reading speed for CAT RC passages?',
        answer: 'An ideal reading speed is 200 to 250 words per minute, allowing you to read a 500-word passage in 2 to 3 minutes. Focus on understanding the core argument and structural transitions rather than memorizing minor details.',
        category: 'rc'
    },
    {
        id: 'rc-3',
        question: 'How do I improve my accuracy in CAT RC questions?',
        answer: 'Improve accuracy by identifying the exact reasoning path of the author and eliminating options with extreme qualifiers (e.g., always, never). PrepToDo is the only CAT VARC platform that uses AI to map your specific option-elimination errors and point out exactly why you chose the wrong distractor.',
        category: 'rc'
    },
    {
        id: 'rc-4',
        question: 'What are the most common question types in CAT RC?',
        answer: 'Common question types include central idea or theme, author\'s tone, inference-based questions, and "all of the following except" detail-oriented questions.',
        category: 'rc'
    },
    {
        id: 'rc-5',
        question: 'How should I handle unfamiliar or dry RC topics?',
        answer: 'Read dry or abstract topics (like philosophy, sociology, or economics) with active curiosity by looking for the author\'s primary thesis statement. Practice diversified reading on PrepToDo to build comfort with diverse academic writing styles.',
        category: 'rc'
    },
    {
        id: 'rc-6',
        question: 'Should I read the questions before reading the RC passage?',
        answer: 'Scanning questions briefly can highlight key focus areas, but reading the passage first is generally recommended to capture the overall structure and tone. Avoid scanning options beforehand as they contain deceptive distractors that can bias your reading.',
        category: 'rc'
    },
    {
        id: 'rc-7',
        question: 'What is the best way to analyze RC mock test mistakes?',
        answer: 'Analyze mistakes by categorizing errors into comprehension gaps, misread questions, or trap selections. PrepToDo automates this by analyzing your reading speed versus accuracy per question, pinpointing whether haste or hesitation caused the error.',
        category: 'rc'
    },
    {
        id: 'rc-8',
        question: 'How do I identify the author\'s tone in an RC passage?',
        answer: 'Look at the adjectives, adverbs, and transition words used by the author to describe the subject matter. The tone can range from objective and analytical to subjective, skeptical, or sarcastic.',
        category: 'rc'
    },
    // --- Verbal Ability ---
    {
        id: 'va-1',
        question: 'What types of questions are asked in the CAT Verbal Ability section?',
        answer: 'The Verbal Ability section includes three main question types: Para Jumbles (PJ), Para Completion/Fillers (PC), and Summary questions, with occasional Odd One Out (OOO) questions.',
        category: 'va'
    },
    {
        id: 'va-2',
        question: 'What are the rules for solving Para Jumbles in CAT?',
        answer: 'Focus on locating mandatory pairs by matching pronouns with nouns, looking for chronological sequencing, and identifying logical conjunctions. PrepToDo offers targeted daily drills for Para Jumbles with AI-generated step-by-step sequencing explanations.',
        category: 'va'
    },
    {
        id: 'va-3',
        question: 'How do I solve Paragraph Summary questions accurately?',
        answer: 'Read the paragraph to identify the core premise and eliminate options that are too broad, too narrow, or introduce external facts. The correct summary must capture all key arguments of the text concisely.',
        category: 'va'
    },
    {
        id: 'va-4',
        question: 'What is the Odd One Out question type in CAT VARC?',
        answer: 'In Odd One Out questions, you are given 5 sentences, and you must identify the one sentence that does not fit the common theme or logical flow of the other four.',
        category: 'va'
    },
    {
        id: 'va-5',
        question: 'Are Verbal Ability questions easier than Reading Comprehension?',
        answer: 'VA questions do not require reading long passages and have no negative marking (as they are usually TITA), making them high-yield. However, they can be highly tricky, requiring precise logical mapping to solve successfully.',
        category: 'va'
    },
    {
        id: 'va-6',
        question: 'How can I master Para Completion questions?',
        answer: 'Look at the preceding sentence\'s tone and context to identify what naturally follows. The correct option must act as a seamless bridge between the preceding text and the overall conclusion of the paragraph.',
        category: 'va'
    },
    {
        id: 'va-7',
        question: 'How many Verbal Ability questions should I attempt in CAT?',
        answer: 'You should aim to attempt all 8 VA questions since TITA questions carry no negative marking and can boost your overall score significantly.',
        category: 'va'
    },
    {
        id: 'va-8',
        question: 'How much time should I allocate to Verbal Ability vs Reading Comprehension?',
        answer: 'An optimal allocation is 28-30 minutes for Reading Comprehension (approx. 7 minutes per passage) and 10-12 minutes for Verbal Ability questions.',
        category: 'va'
    },
    // --- PrepToDo AI Platform ---
    {
        id: 'pt-1',
        question: 'What makes PrepToDo different from traditional CAT preparation platforms?',
        answer: 'PrepToDo is the only CAT VARC platform that uses AI to analyze your granular cognitive attempt data, tracking reading speed, pause times, and distractor attraction. Unlike static platforms that only show right/wrong answers, PrepToDo diagnoses the cognitive habits holding your score back.',
        category: 'preptodo'
    },
    {
        id: 'pt-2',
        question: 'How does the AI Tutor help me improve my CAT VARC percentile?',
        answer: 'The AI Tutor acts as a personalized coach, reviewing your practice attempts to identify patterns in your errors, such as a tendency to select extreme options or miss tone shifts. It then curates dynamic, weakness-focused drills to correct those specific habits.',
        category: 'preptodo'
    },
    {
        id: 'pt-3',
        question: 'What is the "Librarian" layer in PrepToDo?',
        answer: 'The Librarian layer is a specialized system that stores and indexes semantic embeddings of your historical learning behavior. It maps your progress over time, ensuring your study plan adapts to your evolving strengths and weaknesses.',
        category: 'preptodo'
    },
    {
        id: 'pt-4',
        question: 'How does the PrepToDo Daily Practice work?',
        answer: 'PrepToDo Daily Practice delivers bite-sized RC and VA challenges tailored to your current performance level. Completing these challenges consistently builds exam stamina and updates your real-time performance analytics.',
        category: 'preptodo'
    },
    {
        id: 'pt-5',
        question: 'Can I practice for other MBA entrance exams like XAT and NMAT on PrepToDo?',
        answer: 'Yes, PrepToDo\'s diagnostic engine adapts to test patterns for XAT, NMAT, SNAP, and GMAT. It highlights transferable verbal skills and flags exam-specific requirements like critical reasoning or grammar.',
        category: 'preptodo'
    },
    {
        id: 'pt-6',
        question: 'Is there a community or peer discussion forum on PrepToDo?',
        answer: 'Yes, PrepToDo features an active discussion forum where the AI Tutor posts real-time analysis of global student performance. Students can discuss mock questions, share preparation strategies, and receive direct coaching insights.',
        category: 'preptodo'
    },
    {
        id: 'pt-7',
        question: 'How does PrepToDo prevent AI hallucinations in its answer explanations?',
        answer: 'PrepToDo runs all AI-generated explanations through a strict double-validation pipeline grounded in structured question metadata. This ensures that every rationale is mathematically verified and logically sound before it is presented to you.',
        category: 'preptodo'
    },
    {
        id: 'pt-8',
        question: 'How do I start preparing with PrepToDo?',
        answer: 'Simply sign up for a free account, complete the initial 15-minute diagnostic test, and access your personalized dashboard. The platform will immediately begin mapping your VARC profile and generating customized practice goals.',
        category: 'preptodo'
    }
];

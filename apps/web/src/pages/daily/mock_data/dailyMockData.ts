import type { DailyPassage, DailyQuestion } from '../../../types';

// =========================================================
// MOCK DATA FOR DAILY PRACTICE
// =========================================================

const makeUuid = (seed: number) =>
    `00000000-0000-4000-8000-${seed.toString(16).padStart(12, '0')}`;

// RC Passage - Based on a real CAT RC passage style
const rcPassage: DailyPassage = {
    id: makeUuid(6001),
    title: "The Transformation of Urban Spaces",
    content: `
        <p>The last three decades have witnessed a profound transformation in how we conceptualize and utilize urban spaces. What was once viewed primarily as a canvas for concrete and steel is now increasingly recognized as a complex ecosystem that must balance economic vitality with environmental sustainability and social equity.</p>
        
        <p>This shift in perspective has been driven by several converging factors. First, accelerating urbanization has meant that more people than ever before are calling cities home—currently, over half the world's population lives in urban areas, a proportion projected to reach nearly 70% by 2050. This demographic reality has intensified pressure on urban infrastructure while simultaneously highlighting its inadequacies.</p>
        
        <p>Second, growing awareness of climate change has prompted city planners to reconsider the role of urban areas as both contributors to and potential mitigators of environmental challenges. Cities are now understood to be significant sources of carbon emissions, but they also offer opportunities for concentrated climate action through green building practices, efficient public transportation, and expanded urban green spaces.</p>
        
        <p>Third, social movements demanding greater equity in access to public spaces have reshaped the discourse around urban planning. The recognition that not all communities have equally benefited from urban development has led to calls for more inclusive approaches that prioritize the needs of marginalized populations.</p>
        
        <p>The most successful urban transformations have occurred when policymakers have adopted an integrated approach, recognizing that urban spaces are interconnected systems rather than isolated problems to be solved in isolation. Singapore's approach to green urbanism, Copenhagen's bicycle infrastructure, and Medellín's cable car systems serving hillside communities all demonstrate how innovative solutions can emerge when technical expertise is combined with genuine community engagement.</p>
        
        <p>However, significant challenges remain. Rapid gentrification in many cities threatens to displace long-established communities even as it brings investment and improved infrastructure. The tension between density and livability continues to generate controversy, as does the question of who should bear the costs of urban transformation and who should reap its benefits.</p>
    `,
    genre: "Urban Planning",
};

// RC Questions
export const rcQuestions: DailyQuestion[] = [
    {
        id: makeUuid(6101),
        passageId: rcPassage.id,
        questionType: 'rc_question',
        questionText: "According to the passage, which factor has been primarily responsible for changing how urban spaces are viewed?",
        options: [
            { id: 'A', text: "The rise of smart city technologies" },
            { id: 'B', text: "Accelerating urbanization and demographic shifts" },
            { id: 'C', text: "The decrease in global population" },
            { id: 'D', text: "Traditional approaches to city planning" },
        ],
        correctAnswer: 'B',
        rationale: "The passage explicitly states that 'accelerating urbanization has meant that more people than ever before are calling cities home' as a key factor driving the transformation in urban space conceptualization. The demographic reality of increasing urban population is presented as the first major factor.",
        personalizedRationale: "You tend to miss questions about demographic and population statistics. Consider reviewing passages for specific statistics and their implications.",
        difficulty: 'easy',
        tags: ['inference', 'urbanization', 'demographics'],
    },
    {
        id: makeUuid(6102),
        passageId: rcPassage.id,
        questionType: 'rc_question',
        questionText: "The author's mention of Singapore, Copenhagen, and Medellín serves to:",
        options: [
            { id: 'A', text: "Contrast failed urban planning approaches" },
            { id: 'B', text: "Illustrate successful integrated approaches to urban transformation" },
            { id: 'C', text: "Demonstrate the superiority of Western urban planning" },
            { id: 'D', text: "Highlight the challenges of urban development" },
        ],
        correctAnswer: 'B',
        rationale: "The passage introduces these cities as examples of 'successful urban transformations' that demonstrate 'how innovative solutions can emerge when technical expertise is combined with genuine community engagement.' This supports answer choice B.",
        personalizedRationale: "Good job identifying the purpose of examples. Your strength in understanding author's intent is evident.",
        difficulty: 'medium',
        tags: ['purpose', 'examples', 'urban-planning'],
    },
    {
        id: makeUuid(6103),
        passageId: rcPassage.id,
        questionType: 'rc_question',
        questionText: "The passage suggests that a significant challenge in urban transformation is:",
        options: [
            { id: 'A', text: "The lack of innovative solutions" },
            { id: 'B', text: "The tension between density and livability" },
            { id: 'C', text: "Excessive community engagement" },
            { id: 'D', text: "Insufficient carbon emissions from cities" },
        ],
        correctAnswer: 'B',
        rationale: "The passage states that 'The tension between density and livability continues to generate controversy' as one of the significant challenges remaining in urban transformation. The other options either contradict the passage or are not mentioned.",
        personalizedRationale: "You correctly identified the challenge mentioned. Review how the passage introduces counterpoints to main arguments.",
        difficulty: 'medium',
        tags: ['detail', 'challenges', 'urban-planning'],
    },
    {
        id: makeUuid(6104),
        passageId: rcPassage.id,
        questionType: 'rc_question',
        questionText: "The author's attitude toward the future of urban spaces can best be described as:",
        options: [
            { id: 'A', text: "Unquestionably optimistic" },
            { id: 'B', text: "Cautiously hopeful but aware of challenges" },
            { id: 'C', text: "Pessimistic about the ability to address urban problems" },
            { id: 'D', text: "Indifferent to urban development issues" },
        ],
        correctAnswer: 'B',
        rationale: "While the passage highlights successful examples and positive approaches, it also acknowledges 'significant challenges remain' including gentrification and equity concerns. This balanced tone suggests cautious optimism rather than either uncritical optimism or pessimism.",
        personalizedRationale: "Pay attention to the balance between positive examples and challenges mentioned in the passage.",
        difficulty: 'hard',
        tags: ['tone', 'attitude', 'synthesis'],
    },
];

// VA Questions - Para Summary
export const paraSummaryQuestion: DailyQuestion = {
    id: makeUuid(6201),
    passageId: null,
    questionType: 'para_summary',
    questionText: "Which of the following best summarizes the given paragraph?",
    options: [
        { id: 'A', text: "Urban planning must prioritize economic development over environmental and social concerns." },
        { id: 'B', text: "Successful urban transformation requires balancing economic, environmental, and social considerations through integrated approaches and community engagement." },
        { id: 'C', text: "Cities are the primary cause of climate change and must reduce emissions." },
        { id: 'D', text: "The main challenge in urban planning is preventing gentrification." },
    ],
    correctAnswer: 'B',
    rationale: "Option B captures the main idea that successful urban transformation requires balancing multiple considerations (economic vitality, environmental sustainability, and social equity) through integrated approaches, as mentioned throughout the passage.",
    personalizedRationale: "You identified the core message. Your ability to synthesize multiple ideas into one coherent summary is strong.",
    difficulty: 'medium',
    tags: ['para-summary', 'synthesis', 'main-idea'],
};

// Para Jumble Question (TITA)
export const paraJumbleQuestion: DailyQuestion = {
    id: makeUuid(6202),
    passageId: null,
    questionType: 'para_jumble',
    questionText: "The sentences given below, when properly sequenced, form a coherent paragraph. Arrange them in the correct order and enter the sequence (e.g., 2143).",
    options: [
        { id: 'A', text: "Technology has transformed how we communicate and share information." },
        { id: 'B', text: "However, this digital revolution has also created new challenges." },
        { id: 'C', text: "Social media platforms enable instant global connectivity." },
        { id: 'D', text: "Issues like privacy concerns and misinformation have emerged." },
    ],
    sentences: [
        "Technology has transformed how we communicate and share information.",
        "However, this digital revolution has also created new challenges.",
        "Social media platforms enable instant global connectivity.",
        "Issues like privacy concerns and misinformation have emerged.",
    ],
    correctAnswer: '2143',
    rationale: "The correct sequence is 2-1-4-3: The paragraph starts with the transformation claim (2), explains what technology does (1), acknowledges the challenges (4), and elaborates on what those challenges are (3).",
    personalizedRationale: "For para jumble questions, look for transition words like 'However' to identify sentence positions. The answer follows: 2-1-4-3.",
    difficulty: 'hard',
    tags: ['para-jumble', 'logic', 'sequence'],
};

// Para Completion Question
export const paraCompletionQuestion: DailyQuestion = {
    id: makeUuid(6203),
    passageId: null,
    questionType: 'para_completion',
    questionText: "Complete the paragraph by selecting the most appropriate option to fill in the blank:",
    options: [
        { id: 'A', text: "inevitable consequence of progress" },
        { id: 'B', text: "necessary trade-off for development" },
        { id: 'C', text: "small price to pay for innovation" },
        { id: 'D', text: "unavoidable result of technological advancement" },
    ],
    correctAnswer: 'A',
    rationale: "The correct answer is 'inevitable consequence of progress.' The context implies that the outcome being discussed is something that naturally follows from progress, not something that should be accepted as worthwhile (B, C) or simply unavoidable (D - less precise).",
    personalizedRationale: "Review how transitional phrases and context clues help determine the most appropriate completion. Focus on the logical relationship between the blank and surrounding sentences.",
    difficulty: 'medium',
    tags: ['para-completion', 'logic', 'vocabulary'],
};

// Odd One Out Question
export const oddOneOutQuestion: DailyQuestion = {
    id: makeUuid(6204),
    passageId: null,
    questionType: 'odd_one_out',
    questionText: "Five sentences related to education are given. Four of them are alike in meaning or form. Select the one that does NOT belong to the group.",
    options: [
        { id: 'A', text: "Education empowers individuals to achieve their potential." },
        { id: 'B', text: "Learning enables people to reach their career goals." },
        { id: 'C', text: "Schools provide students with knowledge and skills." },
        { id: 'D', text: "Standardized testing measures academic performance accurately." },
    ],
    sentences: [
        "Education empowers individuals to achieve their potential.",
        "Learning enables people to reach their career goals.",
        "Schools provide students with knowledge and skills.",
        "Standardized testing measures academic performance accurately.",
    ],
    correctAnswer: 'D',
    rationale: "Options A, B, and C all focus on the positive role of education/learning in personal development. Option D shifts to discussing standardized testing as a measurement tool, which is thematically different and introduces a claim that could be contested.",
    personalizedRationale: "For odd one out, first identify the common theme. Options A, B, and C share an educational empowerment theme, while D discusses testing as measurement.",
    difficulty: 'medium',
    tags: ['odd-one-out', 'theme', 'reasoning'],
};

// Combined RC Data Package
export const dailyRCData = {
    passage: rcPassage,
    questions: rcQuestions,
};

// Combined VA Data Package
export const dailyVAData = {
    questions: [
        paraSummaryQuestion,
        paraJumbleQuestion,
        paraCompletionQuestion,
        oddOneOutQuestion,
    ],
};

// Full Daily Practice Data
export const dailyPracticeData = {
    rc: dailyRCData,
    va: dailyVAData,
};

// Utility function to get question by ID
export const getQuestionById = (questionId: string): DailyQuestion | undefined => {
    const allQuestions = [...rcQuestions, paraSummaryQuestion, paraJumbleQuestion, paraCompletionQuestion, oddOneOutQuestion];
    return allQuestions.find(q => q.id === questionId);
};

// Utility function to get passage for RC questions
export const getPassageForQuestion = (questionId: string): DailyPassage | undefined => {
    const question = rcQuestions.find(q => q.id === questionId);
    if (question && question.passageId === rcPassage.id) {
        return rcPassage;
    }
    return undefined;
};

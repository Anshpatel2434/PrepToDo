// Reuse the customized-mocks reference data helpers pattern
// But make them daily-content specific

import { supabase } from '../../../../config/supabase';

export async function generateEmbedding(text: string) {
    console.log(`⏳ [Embedding] Waiting for LLM response...`);
    
    const { data: { openai }, error: openaiError } = await supabase.functions.invoke('openai-hook', {
        body: { operation: 'embeddings', input: text }
    });

    if (openaiError) throw new Error(`Embedding generation failed: ${openaiError.message}`);
    
    return openai.embedding;
}

export async function searchPassageAndQuestionEmbeddings(embedding: number[], matchCount: number) {
    console.log(`🔍 [Embedding Search] Searching for ${matchCount} matches`);
    
    // Search passages
    const { data: passageMatches, error: passageError } = await supabase.rpc(
        'match_passages',
        { query_embedding: embedding, match_threshold: 0.75, match_count: matchCount }
    );
    if (passageError) throw new Error(`Passage search failed: ${passageError.message}`);

    // Search questions
    const { data: questionMatches, error: questionError } = await supabase.rpc(
        'match_questions',
        { query_embedding: embedding, match_threshold: 0.75, match_count: matchCount }
    );
    if (questionError) throw new Error(`Question search failed: ${questionError.message}`);

    return {
        passages: passageMatches || [],
        questions: questionMatches || []
    };
}

export async function fetchPassagesData(passageIds: string[]) {
    if (!passageIds.length) return [];
    
    const { data, error } = await supabase
        .from('passages')
        .select('*')
        .in('id', passageIds);
    
    if (error) throw new Error(`Failed to fetch passages: ${error.message}`);
    return data || [];
}

export async function fetchQuestionsData(questionIds: string[], passageIds: string[]) {
    if (!questionIds.length) return [];
    
    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .in('id', questionIds);
    
    if (error) throw new Error(`Failed to fetch questions: ${error.message}`);
    return data || [];
}
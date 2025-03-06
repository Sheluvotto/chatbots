import OpenAI from 'openai';

// Initialize OpenAI client with OpenRouter base URL
const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: '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',
  dangerouslyAllowBrowser: true // Only for demo purposes
});

export const AVAILABLE_MODELS = [
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0' },
  { id: 'cognitivecomputations/dolphin3.0-r1-mistral-24b:free', name: 'Dolphin 3.0' },
  { id: 'sophosympatheia/midnight-rose-70b', name: 'Midnight Rose' },
  { id: 'mistralai/mistral-nemo', name: 'Mistral Nemo (no pdf support)' },
  { id: 'qwen/qwen-vl-plus:free', name: 'Qwen VL Plus (no pdf support)' },
  { id: 'deepseek/deepseek-chat:free', name: 'DeepSeek v3 (no pdf support)' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini (no pdf support)' }
];

export const generateChatResponse = async (
  messages: { role: string; content: string }[], 
  modelId: string = 'google/gemini-2.0-flash-001'
) => {
  try {
    const completion = await client.chat.completions.create({
      model: modelId,
      messages,
      extra_headers: {
        'HTTP-Referer': window.location.href,
        'X-Title': 'Otto Chat Interface',
      },
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error generating response:', error);
    throw error;
  }
};

export const generateMultiModelResponses = async (
  messages: { role: string; content: string }[]
) => {
  try {
    // Create an array of promises for each model
    const responsePromises = AVAILABLE_MODELS.map(model => 
      client.chat.completions.create({
        model: model.id,
        messages,
        extra_headers: {
          'HTTP-Referer': window.location.href,
          'X-Title': 'Otto Chat Interface',
        },
      }).then(completion => ({
        modelId: model.id,
        modelName: model.name,
        content: completion.choices[0].message.content
      })).catch(error => ({
        modelId: model.id,
        modelName: model.name,
        content: `Error: Could not generate response from ${model.name}.`
      }))
    );

    // Wait for all promises to resolve
    return await Promise.all(responsePromises);
  } catch (error) {
    console.error('Error generating multi-model responses:', error);
    throw error;
  }
};

export const generateConsensusResponse = async (
  messages: { role: string; content: string }[]
) => {
  try {
    // First get responses from all models
    const modelResponses = await generateMultiModelResponses(messages);
    
    // Extract just the responses
    const allResponses = modelResponses.map(resp => ({
      model: resp.modelName,
      response: resp.content
    }));
    
    // Create a prompt for consensus
    const consensusPrompt = [
      ...messages,
      {
        role: "system",
        content: `You are a consensus builder. Below are responses from different AI models to the same query. 
        Your task is to analyze these responses, identify the best elements from each, and synthesize a single 
        consensus response that represents the most accurate, helpful, and comprehensive answer.
        
        ${allResponses.map(r => `${r.model}: ${r.response}`).join('\n\n')}
        
        Based on these responses, provide a single consensus answer that combines the best insights from all models.
        Begin your response with "CONSENSUS: " followed by the synthesized answer.`
      }
    ];
    
    // Use one of the more capable models to generate the consensus
    const consensusResponse = await client.chat.completions.create({
      model: 'openai/gpt-4o-mini', // Using GPT-4o Mini for consensus building
      messages: consensusPrompt,
      extra_headers: {
        'HTTP-Referer': window.location.href,
        'X-Title': 'Otto Chat Interface',
      },
    });
    
    return {
      modelId: 'consensus',
      modelName: 'AI Consensus',
      content: consensusResponse.choices[0].message.content || "Could not generate consensus response."
    };
  } catch (error) {
    console.error('Error generating consensus response:', error);
    return {
      modelId: 'consensus',
      modelName: 'AI Consensus',
      content: "Error: Could not generate a consensus response."
    };
  }
};
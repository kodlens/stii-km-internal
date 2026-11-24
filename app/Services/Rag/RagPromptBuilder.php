<?php

namespace App\Services\Rag;

class RagPromptBuilder
{
    /**
     * Build the chat messages array for Ollama /api/chat.
     *
     * @param string $userMessage
     * @param array $passages
     * @param array $history
     * @return array
     */
    public function buildMessages(string $userMessage, array $passages, array $history = []): array
    {
        $systemInstructions = <<<EOT
You are the official DOST-STII Internal Knowledge Management AI Assistant.
Your task is to answer user questions accurately, professionally, and concisely using ONLY the provided Knowledge Base Passages.

Rules:
1. Ground your answer strictly in the provided passages. Do not invent facts, policies, dates, or details.
2. If the answer cannot be found or deduced from the passages, say: "I could not find information regarding this in the STII internal knowledge documents."
3. When referencing rules, policies, or procedures, mention the document title so the user knows where the information comes from.
4. Use clean Markdown formatting with bullet points and bold text where helpful for readability.
EOT;

        // Assemble context text from retrieved passages
        if (! empty($passages)) {
            $contextText = "Relevant STII Knowledge Passages:\n\n";
            foreach ($passages as $index => $passage) {
                $num = $index + 1;
                $contextText .= "[Passage {$num} - Source: {$passage['title']}]\n{$passage['content']}\n\n";
            }
        } else {
            $contextText = "No directly relevant passages were found in the knowledge repository for this question.\n";
        }

        $systemMessage = $systemInstructions . "\n\n" . $contextText;

        $messages = [
            [
                'role' => 'system',
                'content' => $systemMessage,
            ],
        ];

        // Append recent conversational history (up to last 6 messages) if available
        if (! empty($history) && is_array($history)) {
            $recentHistory = array_slice($history, -6);
            foreach ($recentHistory as $item) {
                if (isset($item['role'], $item['content']) && in_array($item['role'], ['user', 'assistant'])) {
                    $messages[] = [
                        'role' => $item['role'],
                        'content' => (string) $item['content'],
                    ];
                }
            }
        }

        // Add the current user query
        $messages[] = [
            'role' => 'user',
            'content' => $userMessage,
        ];

        return $messages;
    }
}

const { SlashCommandBuilder } = require("discord.js");

const forbiddenWords = ["Removed For Security Purposes"];

// Define available roles and their intros
const roles = {
  assistant:
    "You are an assistant, act like one, and speak like one.Also remember, You are present in a virtual democracy on Discord called 'SimDemocracy'.",
  law_consultant:
    "You are a law consultant, provide professional legal advice always remind the user you dont know much about SimDemocracy law. Also remember, You are present in a virtual democracy on Discord called 'SimDemocracy'.",
  ai_poli:
    "You are now 'AI Politician'. You are present in a virtual democracy on Discord called 'SimDemocracy'.",
};

// Memory to store the last 5 messages (conversation history)
let messageHistory = [];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ai")
    .setDescription("Send a prompt to the AI with a role or profession")
    .addStringOption((option) =>
      option
        .setName("role")
        .setDescription(
          "Select the role of the AI (e.g., assistant, law consultant, etc.)"
        )
        .setRequired(true)
        .addChoices(
          { name: "Assistant", value: "assistant" },
          { name: "Law Consultant", value: "law_consultant" }
          // Add more roles as needed
        )
    )
    .addStringOption((option) =>
      option
        .setName("prompt")
        .setDescription("The prompt to send to the AI")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    let prompt = interaction.options.getString("prompt");
    const role = interaction.options.getString("role");

    if (forbiddenWords.some((word) => prompt.toLowerCase().includes(word))) {
      return interaction.editReply({
        content:
          "Your prompt contains forbidden words and cannot be processed.",
      });
    }

    // Get the intro for the selected role, or default to a generic message if not found
    const roleIntro =
      roles[role] ||
      "You are a professional AI, give a helpful response. Keep response at or below 100 words. Also remember, You are present in a virtual democracy on Discord called 'SimDemocracy'.";

    // Modify the prompt by adding the role's intro directly to it
    const modifiedPrompt = `The person named ${interaction.user.username} asked: ${prompt}. Make response at or below 100 words. Keep in mind, ${roleIntro}`;

    // Update the message history with the new prompt
    messageHistory.push({
      role: "user",
      content: modifiedPrompt,
    });

    // Ensure message history contains no more than 5 messages
    if (messageHistory.length > 5) {
      messageHistory.shift(); // Remove the oldest message if history exceeds 5
    }

    // Prepare the conversation history for the API request
    const conversationHistory = [
      {
        role: "system",
        content: roleIntro,
      },
      ...messageHistory, 
    ];


    if (conversationHistory.length > 1) {
      const apiUrl = "http://IP:11434/api/chat"; // IP Removed

      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "phi4",
            messages: conversationHistory,
            stream: false, 
          }),
        });


        const rawResponse = await response.text();
        const data = JSON.parse(rawResponse); 


        const assistantResponse =
          data?.message?.content || "No response from API.";

        const finalReply = `${assistantResponse}\n\n-# AI can make mistakes. Treat everything it says as fiction. Please note, this AI is from an external source.`;

        return interaction.editReply({ content: finalReply });
      } catch (error) {
        console.error("Error fetching API:", error);
        return interaction.editReply({
          content: "An error occurred while fetching the response.",
        });
      }
    } else {
      return interaction.editReply({
        content: "No conversation history to send to the API.",
      });
    }
  },
};

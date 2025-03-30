const { SlashCommandBuilder } = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ai")
    .setDescription("Send a prompt to the AI with a role.")
    .addStringOption((option) =>
      option
        .setName("role")
        .setDescription(
          "Select the role of the AI (e.g., assistant, law consultant)."
        )
        .setRequired(true)
        .addChoices(
          { name: "Assistant", value: "assistant" },
          { name: "Law Consultant", value: "law_consultant" }
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

    const apiUrl = "http://IP:11434/api/chat"; // Removed IP

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "phi4",
          messages: [{ role: "user", content: prompt }],
          stream: false,
        }),
      });

      const rawResponse = await response.text();
      const data = JSON.parse(rawResponse);
      const assistantResponse =
        data?.message?.content || "No response from API.";

      return interaction.editReply({ content: assistantResponse });
    } catch (error) {
      console.error("Error fetching API:", error);
      return interaction.editReply({
        content: "An error occurred while fetching the response.",
      });
    }
  },
};

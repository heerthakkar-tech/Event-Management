const { randomUUID } = require("crypto");

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert("category", [
      {
        id: randomUUID(),
        name: "Technology",
        isActive: true,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
      {
        id: randomUUID(),
        name: "Music",
        isActive: true,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
      {
        id: randomUUID(),
        name: "Business",
        isActive: true,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
      {
        id: randomUUID(),
        name: "Education",
        isActive: true,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
      {
        id: randomUUID(),
        name: "Sports",
        isActive: true,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("category", {
      name: ["Technology", "Music", "Business", "Education", "Sports"],
    });
  },
};

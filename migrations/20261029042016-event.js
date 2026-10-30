module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("event", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      organizerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "user",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      categoryId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "category",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },

      startAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      endAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      location: {
        type: Sequelize.TEXT,
        allowNull: false,
      },

      capacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      ticketPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },

      status: {
        type: Sequelize.ENUM("draft", "scheduled", "published", "cancelled"),
        allowNull: false,
        defaultValue: "draft",
      },

      publishAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      publishedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      cancelledAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      bannerUrl: {
        type: Sequelize.STRING(2048),
        allowNull: true,
      },

      bannerPublicId: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("event");

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_event_status";',
    );
  },
};

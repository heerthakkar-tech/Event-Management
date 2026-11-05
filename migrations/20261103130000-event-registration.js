module.exports = {
  async up(queryInterface, Sequelize) {
    // Create event_registration table
    await queryInterface.createTable("event_registration", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "user",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      eventId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "event",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      status: {
        type: Sequelize.ENUM("confirmed", "waitlisted", "cancelled"),
        allowNull: false,
        defaultValue: "confirmed",
      },

      registeredAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      cancelledAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      waitlistPosition: {
        type: Sequelize.INTEGER,
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
    });

    await queryInterface.addIndex(
      "event_registration",
      ["eventId", "userId", "status"],
      {
        name: "event_registration_user_status_idx",
      },
    );

    await queryInterface.addIndex(
      "event_registration",
      ["eventId", "status", "waitlistPosition"],
      {
        name: "event_registration_waitlist_idx",
      },
    );

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX event_registration_active_unique_idx
      ON event_registration ("eventId", "userId")
      WHERE status IN ('confirmed', 'waitlisted');
    `);
  },

  async down(queryInterface, Sequelize) {
    // dropping the table also removes its indexes
    await queryInterface.dropTable("event_registration");

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_event_registration_status";',
    );
  },
};

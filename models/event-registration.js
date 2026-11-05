const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class EventRegistration extends Model {
    static associate(models) {
      EventRegistration.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
      });

      EventRegistration.belongsTo(models.Event, {
        foreignKey: "eventId",
        as: "event",
      });
    }
  }
  EventRegistration.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      eventId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("confirmed", "waitlisted", "cancelled"),
        allowNull: false,
        defaultValue: "confirmed",
      },
      registeredAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      cancelledAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      waitlistPosition: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "EventRegistration",
      tableName: "event_registration",
      timestamps: true,
    },
  );
  return EventRegistration;
};

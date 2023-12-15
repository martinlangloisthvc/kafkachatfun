const { Kafka } = require("kafkajs");

const clientId = `chat-app-${Math.ceil(Math.random() * 100)}`;

const kafka = new Kafka({
  clientId,
  brokers: ["localhost:9093"],
});

const producer = kafka.producer();
const consumer = kafka.consumer({
  groupId: clientId,
});

const boot = async () => {
  await producer.connect();
  await consumer.connect();
};

const sendMessage = async (message) => {
  await producer.send({
    topic: "chat_messages", // Use the name of your topic
    messages: [{ value: JSON.stringify(message) }],
  });
};

const bootKafka = async (io) => {
  // Connect to Kafka
  await boot();
  // Consume messages
  await consumer.subscribe({ topic: "chat_messages", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log(topic, message.value.toJSON());
      if (topic == "chat_messages")
        io.emit("NEW_MESSAGE", JSON.parse(message.value.toString()));
    },
  });
};

exports.bootKafka = bootKafka;
exports.sendMessage = sendMessage;

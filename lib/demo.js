// Authored scenario; commands execute in the real engine.
export const DEMO = [
  {
    "title": "One conversation. Two coffees.",
    "scene": "01 / THE COUNTER",
    "actor": {
      "role": "customer",
      "customer": "Aria"
    },
    "text": "Two lattes, please. One with dairy and one with oat milk.",
    "response": "Of course. Two hot lattes: one dairy, one oat. Anything you would like to change?",
    "actions": [
      {
        "type": "create",
        "items": [
          {
            "product": "latte"
          },
          {
            "product": "latte",
            "milk": "oat"
          }
        ]
      }
    ]
  },
  {
    "title": "A correction, without starting over.",
    "scene": "01 / THE COUNTER",
    "actor": {
      "role": "customer",
      "customer": "Aria"
    },
    "text": "Actually, make the second one iced.",
    "response": "The oat latte is now iced. Your dairy latte stays hot.",
    "actions": [
      {
        "type": "change",
        "orderId": "C12",
        "itemId": "C12-2",
        "changes": {
          "temperature": "iced"
        }
      }
    ]
  },
  {
    "title": "Say yes. The whole café hears it.",
    "scene": "02 / SHARED STATE",
    "actor": {
      "role": "customer",
      "customer": "Aria"
    },
    "text": "Perfect. Send the order.",
    "response": "You're all set, Aria. We'll call you when both coffees are ready.",
    "actions": [
      {
        "type": "confirm",
        "orderId": "C12"
      }
    ]
  },
  {
    "title": "Two customers. One stock count.",
    "scene": "02 / SHARED STATE",
    "actor": {
      "role": "customer",
      "customer": "Leo"
    },
    "text": "One large hot oat latte for me.",
    "response": "One large hot oat latte. That is one hundred and ninety dollars. Shall I send it?",
    "actions": [
      {
        "type": "create",
        "items": [
          {
            "product": "latte",
            "milk": "oat",
            "size": "large"
          }
        ]
      }
    ]
  },
  {
    "title": "The last oat portion is reserved.",
    "scene": "02 / SHARED STATE",
    "actor": {
      "role": "customer",
      "customer": "Leo"
    },
    "text": "Yes, please.",
    "response": "Your order is in, Leo. We'll call you when it's ready.",
    "actions": [
      {
        "type": "confirm",
        "orderId": "C13"
      }
    ]
  },
  {
    "title": "A third customer joins the rush.",
    "scene": "03 / A REAL CONSTRAINT",
    "actor": {
      "role": "customer",
      "customer": "Mia"
    },
    "text": "Can I have an iced oat latte?",
    "response": "Let me check that for you.",
    "actions": [
      {
        "type": "create",
        "items": [
          {
            "product": "latte",
            "milk": "oat",
            "temperature": "iced"
          }
        ]
      }
    ]
  },
  {
    "title": "No imaginary inventory.",
    "scene": "03 / A REAL CONSTRAINT",
    "actor": {
      "role": "customer",
      "customer": "Mia"
    },
    "text": "Send it, please.",
    "response": "Sorry, we're out of oat milk. Would you prefer dairy milk or an iced Americano?",
    "actions": [
      {
        "type": "confirm",
        "orderId": "C14"
      }
    ],
    "expectedError": "OUT_OF_STOCK"
  },
  {
    "title": "A useful alternative, in context.",
    "scene": "03 / A REAL CONSTRAINT",
    "actor": {
      "role": "customer",
      "customer": "Mia"
    },
    "text": "An iced Americano sounds good.",
    "response": "Changed to an iced Americano. One hundred and twenty dollars.",
    "actions": [
      {
        "type": "change",
        "orderId": "C14",
        "itemId": "C14-1",
        "changes": {
          "product": "americano",
          "milk": "none"
        }
      }
    ]
  },
  {
    "title": "Recovered. Ready for the bar.",
    "scene": "03 / A REAL CONSTRAINT",
    "actor": {
      "role": "customer",
      "customer": "Mia"
    },
    "text": "Yes. Send that.",
    "response": "You're all set, Mia. We'll call you when your Americano is ready.",
    "actions": [
      {
        "type": "confirm",
        "orderId": "C14"
      }
    ]
  },
  {
    "title": "Meet your barista’s copilot.",
    "scene": "04 / THE WORKSTATION",
    "actor": {
      "role": "barista"
    },
    "text": "Start Aria’s oat latte.",
    "response": "Starting the iced oat latte on C12. Check the ticket, then extract a double espresso.",
    "actions": [
      {
        "type": "start",
        "orderId": "C12",
        "itemId": "C12-2"
      }
    ]
  },
  {
    "title": "A late change reaches a human.",
    "scene": "04 / THE WORKSTATION",
    "actor": {
      "role": "customer",
      "customer": "Aria"
    },
    "text": "Sorry! Can my oat latte be hot after all?",
    "response": "Let me check with Sam if he can still change it.",
    "actions": [
      {
        "type": "change",
        "orderId": "C12",
        "itemId": "C12-2",
        "changes": {
          "temperature": "hot"
        }
      }
    ]
  },
  {
    "title": "Human judgment. Instant coordination.",
    "scene": "04 / THE WORKSTATION",
    "actor": {
      "role": "barista"
    },
    "text": "Yes, I can make it hot.",
    "response": "Got it, Sam. Make Aria's oat latte hot.",
    "actions": [
      {
        "type": "acceptChange",
        "orderId": "C12",
        "itemId": "C12-2"
      }
    ]
  },
  {
    "title": "Guidance follows the actual ticket.",
    "scene": "05 / THE COACH",
    "actor": {
      "role": "barista"
    },
    "text": "Ticket checked. What is next?",
    "response": "Extract a double espresso according to the café recipe. The milk on this ticket is oat, and the drink is hot.",
    "actions": [
      {
        "type": "step",
        "orderId": "C12",
        "itemId": "C12-2"
      }
    ]
  },
  {
    "title": "One step at a time.",
    "scene": "05 / THE COACH",
    "actor": {
      "role": "barista"
    },
    "text": "Espresso is ready.",
    "response": "Now steam oat milk until silky, using the café temperature target. Keep the dairy pitcher separate.",
    "actions": [
      {
        "type": "step",
        "orderId": "C12",
        "itemId": "C12-2"
      }
    ]
  },
  {
    "title": "Finish with confidence.",
    "scene": "05 / THE COACH",
    "actor": {
      "role": "barista"
    },
    "text": "The milk is steamed.",
    "response": "Pour the espresso, finish the drink, and check that the ticket still says hot oat latte.",
    "actions": [
      {
        "type": "step",
        "orderId": "C12",
        "itemId": "C12-2"
      }
    ]
  },
  {
    "title": "A finished cup, everywhere.",
    "scene": "06 / THE HANDOFF",
    "actor": {
      "role": "barista"
    },
    "text": "Aria's oat latte is ready.",
    "response": "Oat latte done. Aria's dairy latte is next.",
    "actions": [
      {
        "type": "ready",
        "orderId": "C12",
        "itemId": "C12-2"
      }
    ]
  },
  {
    "title": "A retry is still one order.",
    "scene": "06 / THE HANDOFF",
    "actor": {
      "role": "customer",
      "customer": "Leo"
    },
    "text": "Did my order go through? My screen froze.",
    "response": "Yes, Leo. We have your order. You don't need to send it again.",
    "actions": [
      {
        "type": "confirm",
        "orderId": "C13"
      }
    ],
    "duplicateOf": 4
  }
];

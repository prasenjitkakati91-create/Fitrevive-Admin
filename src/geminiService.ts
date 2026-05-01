import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function askAI(prompt: string, context: any) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [{ text: `You are a professional Physical Therapy Clinic Assistant for "FitRevive". 
          Your goal is to help clinic staff (Admins, Managers, Physiotherapists) manage their data efficiently.
          
          You have access to a summary of the current clinic state:
          - Total Patients: ${context.patientsCount}
          - Active Patients: ${context.activePatients}
          - Appointments Today: ${context.appointmentsToday}
          - Monthly Revenue: ₹${context.monthlyRevenue.toLocaleString('en-IN')}
          
          Recent Activity Highlights:
          - Today's Schedule: ${JSON.stringify(context.todaySchedule)}
          - Newest Patients: ${JSON.stringify(context.recentPatients)}
          
          Guidelines:
          1. Be professional, concise, and helpful.
          2. When asked about specific patients or figures, use the provided context.
          3. If the data isn't in the summary, suggest looking into the specific tab (Dashboard, Patients, Appointments, Finances).
          4. Format financial figures in INR (₹).
          
          User Question: ${prompt}` }]
        }
      ],
      config: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1024,
      }
    });

    return response.text;
  } catch (error) {
    console.error("AI Error:", error);
    return "I'm sorry, I encountered an error while processing your request.";
  }
}

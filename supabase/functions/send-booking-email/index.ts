import { serve } from 'https://deno.fresh.dev/std@v9.6.1/http/server.ts'
import { SmtpClient } from 'https://deno.land/x/smtp/mod.ts'

const GMAIL_USER = Deno.env.get('GMAIL_USER')
const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD')
const NOTIFICATION_EMAIL = Deno.env.get('NOTIFICATION_EMAIL')

interface BookingData {
  firstName: string
  lastName: string
  fromLocation: string
  toLocation: string
  departureDate: string
  departureTime: string
  returnDate?: string
  returnTime?: string
  groupSize: number
  isPrivateHire: boolean
  isSolo: boolean
  mobileNumber: string
  messenger?: string
  totalAmount: number
}

serve(async (req) => {
  try {
    const { bookingData } = await req.json() as { bookingData: BookingData }
    
    const client = new SmtpClient()
    
    await client.connectTLS({
      hostname: 'smtp.gmail.com',
      port: 465,
      username: GMAIL_USER,
      password: GMAIL_APP_PASSWORD,
    })

    const emailBody = `
      New Booking Received!

      Customer Details:
      Name: ${bookingData.firstName} ${bookingData.lastName}
      Mobile: ${bookingData.mobileNumber}
      ${bookingData.messenger ? `Messenger: ${bookingData.messenger}` : ''}

      Trip Details:
      From: ${bookingData.fromLocation}
      To: ${bookingData.toLocation}
      Departure: ${bookingData.departureDate} at ${bookingData.departureTime}
      ${bookingData.returnDate ? `Return: ${bookingData.returnDate} at ${bookingData.returnTime}` : 'One-way trip'}

      Service Type: ${bookingData.isPrivateHire ? 'Private Hire' : bookingData.isSolo ? 'Solo Traveler' : 'Group'}
      Number of Passengers: ${bookingData.groupSize}

      Total Amount: ₱${bookingData.totalAmount}
    `

    await client.send({
      from: GMAIL_USER,
      to: NOTIFICATION_EMAIL,
      subject: `New Booking: ${bookingData.firstName} ${bookingData.lastName}`,
      content: emailBody,
    })

    await client.close()

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Email sending failed:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
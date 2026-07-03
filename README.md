# Professional Laundry Service

A comprehensive, end-to-end web application built with **Next.js** for managing a modern laundry and ironing service. This application provides both a customer-facing booking portal and a powerful admin dashboard to manage operations, workers, billing, and order tracking.

---

## 🌊 Application Dataflow

The system architecture relies on a seamless flow of data between the customer, the database, and the admin staff.

### 1. Customer Booking Flow
1. **Service Selection:** Customers visit the landing page and select a desired service (e.g., Ironing, Wash & Iron).
2. **Details & Estimation:** They fill out the `BookingForm`, providing their contact info (Name, Phone, Society, Flat) and preferred pickup date/time. They can optionally select specific clothing items to see an estimated total.
3. **Submission:** Upon submission, a `POST` request is sent to `/api/orders`. The order is saved to the **Supabase** database with an initial status of `NEW`.
4. **Confirmation:** The customer is redirected to a visually rich success page (`/booking-confirmed`).

### 2. Admin Operations & Lifecycle Flow
Admins access the `/admin` portal to move orders through their lifecycle:

* **[NEW] → [PICKED]**
  * Admins view incoming requests in the **Pickup** tab. 
  * Once the clothes are collected from the customer's flat, the admin clicks "Confirm Pickup". A `PATCH` request updates the database status to `PICKED`.
  * Alternatively, admins can use the **Walk-in** tab to manually create orders for customers who drop off clothes directly at the shop. These are immediately created as `PICKED`.

* **[PICKED] Processing & Billing**
  * In the **Orders** tab, admins process the collected clothes.
  * **Itemization:** Admins update the exact item counts (e.g., 3 Shirts, 2 Jeans). The system automatically calculates the exact `total_price` based on predefined constants.
  * **Worker Assignment:** Orders are assigned to specific workers (e.g., Anil, Sikandar) for revenue tracking.
  * **Tag Printing:** Admins click **Print Tags** to generate and print physical labels (e.g., "1/4 Shirt", "2/4 Jeans") to attach to the garments.
  * Once ironing/washing is complete, the admin updates the status to `READY`.

* **[READY] → [DELIVERED]**
  * The **Ready** tab lists all processed orders waiting to be returned.
  * Admins can click the **WhatsApp** icon to automatically generate a pre-filled message for the customer, containing their order status, a list of items, total cost, and a **one-click UPI payment link**.
  * Once handed back to the customer, the order is marked as `DELIVERED`, completing the lifecycle.

---

## ✨ Key Features

### 🛒 Customer Facing
* **Intuitive Booking UI:** A sleek, mobile-first interface featuring modern animations (Framer Motion) and a translucent glassmorphism design.
* **Smart Auto-fill:** Remembers returning customers based on their phone numbers to speed up future bookings.
* **Live Price Estimation:** Customers can input their clothing items during booking to get an immediate cost estimate based on standard pricing.
* **Intelligent Date Selection:** Automatically handles business logic (e.g., blocking Tuesdays, pushing late evening orders to the next day).

### 🛡️ Admin Dashboard
* **Unified Lifecycle Management:** Dedicated views for every stage of an order (Pickup, Orders, Ready, Delivered) to prevent bottlenecks.
* **Walk-In Support:** A dedicated manual entry form for offline customers, featuring the exact same itemized selection UI as the customer portal.
* **Automated Billing & Discounts:** Calculate totals dynamically based on `items_json` and apply percentage discounts (5%, 10%, 20%) with a single click.
* **WhatsApp & UPI Integration:** Deep-linked WhatsApp messaging that automatically formats invoices and embeds a UPI intent URL (supporting GPay, PhonePe, Paytm, etc.).
* **Physical Tag Printing:** Generates print-ready UI layouts for thermal label printers (30x50mm). Prints individual tags for every single garment without barcodes or pricing, ensuring privacy and organization.
* **Analytics & Dashboard:** Real-time revenue tracking, order volume metrics, and worker performance summaries with adjustable date ranges.
* **Society Filtering:** Filter the entire dashboard by specific residential societies to optimize delivery routes.

---

## 🛠️ Tech Stack

* **Framework:** Next.js (App Router)
* **Styling:** Tailwind CSS (with custom glassmorphism and light-theme aesthetics)
* **Icons:** Lucide React
* **Animations:** Framer Motion
* **Database:** Supabase (PostgreSQL)
* **API:** Next.js Serverless Route Handlers

---

## 🚀 Getting Started

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables (Supabase URL and Anon Key) in `.env.local`.
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) for the customer view, and [http://localhost:3000/admin](http://localhost:3000/admin) for the admin portal.

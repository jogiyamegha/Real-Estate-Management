<div align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=40&pause=1000&color=2196F3&center=true&vCenter=true&width=800&height=100&lines=Real+Estate+Management+Platform;Comprehensive+Backend+Architecture;Empowering+Admins,+Agents,+Buyers,+and+Sellers" alt="Typing SVG" />
</div>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
</p>

---

## 🌟 About The Project

This repository contains the robust backend architecture for the **Real Estate Management Platform**. It provides a scalable and secure API designed to streamline real estate operations, manage properties, and facilitate seamless communication between all stakeholders in the property market. 

Built with performance and scalability in mind, it utilizes real-time websockets, robust cloud storage, and secure authentication flows.

---

## 📱 The 4 Core Applications (Modules)

The system is compartmentalized into **4 distinct applications/portals**, each serving a specific user role with tailored functionalities:

<div align="center">
  <table>
    <tr>
      <td align="center" width="25%">
        <img src="https://cdn-icons-png.flaticon.com/512/9308/9308115.png" width="80" alt="Admin"/>
        <br />
        <b>1. Admin Portal</b>
        <br />
        <i>System oversight, user management, and platform configurations.</i>
      </td>
      <td align="center" width="25%">
        <img src="https://cdn-icons-png.flaticon.com/512/1055/1055644.png" width="80" alt="Agent"/>
        <br />
        <b>2. Agent App</b>
        <br />
        <i>Property management, client communication, and deal tracking.</i>
      </td>
      <td align="center" width="25%">
        <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" width="80" alt="Buyer"/>
        <br />
        <b>3. Buyer App</b>
        <br />
        <i>Property search, scheduling viewings, and purchasing flows.</i>
      </td>
      <td align="center" width="25%">
        <img src="https://cdn-icons-png.flaticon.com/512/2951/2951296.png" width="80" alt="Seller"/>
        <br />
        <b>4. Seller App</b>
        <br />
        <i>Property listing, analytics, and agent collaborations.</i>
      </td>
    </tr>
  </table>
</div>

---

## ⚡ Key Features

- **Role-Based Access Control (RBAC):** Secure JWT authentication tailored for Admins, Agents, Buyers, and Sellers.
- **Real-Time Communication:** Integrated `Socket.io` for instant chat and notifications between parties.
- **Advanced Property Management:** Complete CRUD operations for property listings, categories, and media.
- **Cloud Infrastructure:** `AWS S3` for high-performance image/document storage and `AWS SES` for reliable email delivery.
- **Push Notifications:** Firebase Cloud Messaging (FCM) integration for real-time mobile and web alerts.
- **Media Optimization:** On-the-fly image processing and resizing using `Sharp`.
- **Automated Tasks:** Scheduled chron jobs via `node-cron` for system maintenance and reminders.

---

## 🛠️ Technology Stack

| Category | Technologies Used |
|---|---|
| **Core** | Node.js, Express.js |
| **Database** | MongoDB, Mongoose ODM |
| **Cloud & Storage** | AWS S3, AWS SES |
| **Real-Time & Notifications** | Socket.io, Firebase Admin |
| **Security & Auth** | JWT (JSON Web Tokens), bcryptjs |
| **Utilities** | Multer, Sharp, Handlebars, Axios, OpenAI |

---

## 🚀 Getting Started

Follow these steps to set up the project locally.

### 1. Prerequisites
- Node.js (v14 or higher)
- MongoDB instance (local or Atlas)

### 2. Installation
Clone the repository and install dependencies:

```bash
git clone https://github.com/jogiyamegha/Real-Estate-Management.git
cd Real-Estate-Management
npm install
```

### 3. Configuration
Create a `dev.env` file inside the `config/` directory and configure the required environment variables (Database URI, AWS Credentials, JWT Secrets, Firebase keys).

### 4. Running the Server

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

The server will start on the specified port (default `3000`).

---

<div align="center">
  <p><i>Developed with ❤️ for the Real Estate Industry</i></p>
</div>

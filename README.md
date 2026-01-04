# ጠርሙስ መልሱ
> **"Return the Bottle"** — A Digital Ledger for Ethiopian Retailers.

[![Status](https://img.shields.io/badge/Status-In--Development-green)]()
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20Web-blue)]()

## 🇪🇹 Overview
**ጠርሙስ መልሱ** is a specialized inventory and relationship management tool designed to solve the problem of bottle loss in small shops. By differentiating between **Trusted** and **New** customers, it ensures accountability without hurting customer loyalty.

## 1. Background
In many areas of Ethiopia, beverages such as beer and soft drinks are sold in returnable glass bottles. Customers purchase the liquid, while the glass bottle remains the property of the beverage supplier and is loaned through retail shops.

Shops are responsible for returning empty bottles to distributors to restock products. Currently, the system relies heavily on manual tracking, trust, and memory, which causes frequent losses. Shopkeepers often forget what bottles were given, and customers may forget to return them. Over time, these misplaced bottles lead to significant financial loss for the retailer.

## 2. Statement of the Problem
The current manual bottle return system has several shortcomings:
* **Inconsistent Enforcement:** Deposit rules are applied haphazardly.
* **Poor Record-Keeping:** No central ledger for outstanding bottles.
* **Ambiguous Ownership:** Lack of proof regarding who holds which bottles.
* **Lack of Accountability:** No system to flag overdue bottles or "trusted" client loopholes.

**Result:** Financial loss, restocking struggles, and avoidable conflicts between shopkeepers and customers.

## 3. Objectives
### 3.1 General Objective
To design a simple, reliable system that reduces bottle loss and improves accountability between shopkeepers and customers through digital tracking.

### 3.2 Specific Objectives
* Track bottles issued to and returned by customers in real-time.
* Enforce consistent deposit rules (New vs. Trusted clients).
* Provide clear visibility of outstanding bottles per customer.
* Ensure functionality in low-connectivity environments (Offline-First).
* Minimize financial loss and improve the restocking cycle.

## 4. Scope
### ✅ Included
* **Target:** Small retail shops using returnable bottles.
* **Platform:** Android or Mobile Web Application.
* **Core Logic:** Recording "Out" and "In" transactions.
* **Client Logic:** Differentiation between "New" (Deposit required) and "Trusted" (No deposit) clients.
* **Storage:** Local-first storage with optional cloud backup.

### ❌ Excluded
* Integration with beverage company ERPs.
* Hardware-based scanning (QR/RFID).
* Automated online payment processing.
* Large-scale warehouse inventory management.

## 5. Benefits
* **For Shopkeepers:** Reduced financial loss, better stock availability, and faster daily operations.
* **For Customers:** Fair treatment, clear responsibility, and faster deposit refunds.
* **For the Community:** Increased glass reuse and reduced environmental waste.

## 6. Requirements

### 6.1 Functional Requirements
1. **Customer Management:** Add/manage customers and toggle their status (New vs. Trusted).
2. **Transaction Logging:** Record bottles given out and bottles returned.
3. **Deposit Enforcement:** Automatically calculate deposit requirements based on customer status.
4. **Balance Tracking:** View a live list of "Outstanding Bottles" per customer.
5. **Reporting:** View daily and weekly summaries of bottle flow.
6. **Data Resilience:** Work offline and sync data once a connection is established.
7. **Security:** Prevent unauthorized edits to past transaction logs.

### 6.2 Non-Functional Requirements
* **Usability:** High-contrast, simple UI for fast-paced retail environments.
* **Performance:** Transactions must process in under 5 seconds.
* **Reliability:** Local data must be persistent and survive app restarts.
* **Scalability:** System should handle hundreds of customers without slowdown.


## 7. Business Logic & Workflow
The system must bifurcate its logic based on the **Customer Trust Profile**:

### 7.1 New Customer Workflow (Deposit-Protected)
* **Issuance:** System requires a mandatory cash deposit per bottle.
* **Return:** Upon return of the physical bottle, the system calculates and triggers a refund of the original deposit.
* **Financial Integrity:** Ensures the shopkeeper is never at a net loss if the bottle is not returned.

### 7.2 Trusted Customer Workflow (Credit-Based)
* **Issuance:** No cash deposit is required. 
* **Mandatory Recording:** To ensure "Fair Treatment" does not lead to loss, the system **must** log:
    * customer information like (Name, Phone, Address).
    * Quantity and type of bottles.
    * Date and timestamp of the transaction.
    * Payment status of the liquid contents.
* **Accountability:** Outstanding bottles are added to the customer's digital "debt profile" until physically returned.


*Bottle Return Tracking System Project - 2026*

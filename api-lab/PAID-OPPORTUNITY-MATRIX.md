# Paid Opportunity Matrix — 2026-09-11

## Objective
Generate near-term revenue to fund EASY by building small B2B automation pilots around problems companies already budget to solve.

## Commercial rule
We do not sell APIs. We sell a measurable business outcome. Each pilot must have a buyer, a recurring workflow, a baseline cost, a KPI, and a credible paid deployment path.

## Ranked opportunities

| Rank | Problem | Buyer | Prototype | APIs / data | KPI | Initial pilot | Likely recurring price |
|---|---|---|---|---|---|---|---|
| 1 | Customer-support ticket triage + draft replies | Head of Support / COO | Ingest synthetic tickets, classify, retrieve policy/order context, draft response, escalate uncertain cases | LLM + Search + Ecommerce/CRM adapter | resolution rate, first-response time, human minutes/ticket | 7–14 days | $500–$2,500/mo + usage |
| 2 | Invoice extraction + PO matching | CFO / Finance Ops | Extract invoice fields, normalize vendors, match invoice↔PO, route exceptions | OCR + LLM + ERP adapter | processing time, exception rate, cost/document | 7–14 days | $750–$3,000/mo or per document |
| 3 | B2B quote/RFQ automation | Sales Ops / CRO | Parse RFQ email/PDF, extract line items, create structured quote draft, flag missing data | OCR + LLM + Search + CRM/commerce adapter | quote turnaround, rep hours, error rate | 10–21 days | $1,000–$5,000/mo |
| 4 | Shipment exception monitor | Logistics COO | Poll tracking events, detect late/failed delivery, generate customer notification and escalation | Delivery Tracking + LLM + Messaging adapter | failed deliveries, tickets/shipment, response time | 7–14 days | $750–$3,000/mo + shipment volume |
| 5 | Product/catalog data quality | Ecommerce COO | Detect missing attributes, inconsistent titles, duplicate SKUs, bad images/data | Vision + LLM + Ecommerce adapter | error rate, conversion-impacting defects, cleanup hours | 7–14 days | $500–$2,500/mo |
| 6 | Ad/product-feed QA | CMO / Growth | Validate product feeds and creative metadata, detect missing fields/policy-risk patterns | Vision + LLM + Ads/ecommerce adapter | rejected assets, analyst hours, launch time | 7–14 days | $500–$2,500/mo |
| 7 | Lead qualification + CRM cleanup | CRO / Sales Ops | Normalize leads, enrich, score, route, draft next action | Search + LLM + CRM adapter | qualified-lead rate, rep hours, response time | 10–21 days | $750–$3,000/mo |
| 8 | Pricing/quote consistency checker | CFO / CPO / Sales Ops | Compare quote against contract/pricing rules and flag leakage | LLM + Search + commerce/CRM adapter | pricing errors, revenue leakage, review time | 10–21 days | $1,000–$4,000/mo |
| 9 | Support churn-risk detector | Customer Success / COO | Detect cancellation/churn signals across tickets and account events | LLM + Search + analytics/CRM adapter | churn-risk detection, saved accounts, escalation speed | 14–30 days | $1,000–$4,000/mo |
| 10 | Back-office document workflow | COO / Finance Ops | Classify incoming documents and route them to the right workflow | OCR + LLM + Search | manual handling time, routing accuracy | 7–14 days | $500–$2,500/mo |

## Why these first

Customer support, back-office document processing, quoting, logistics exceptions, and commerce data quality have a strong combination of high repetition, verifiable output, recoverable errors, and identifiable budget owners. Public 2026 industry evidence also shows customer support and back-office automation among the most common B2B AI deployments, while data quality remains a major barrier.

## Pricing strategy

Start with a paid pilot rather than a long enterprise contract:

1. **Diagnostic / proof-of-value:** $0–$500 only when needed to remove sales friction.
2. **Paid pilot:** $500–$3,000 for 2–4 weeks, with one KPI and a defined workflow.
3. **Production:** $500–$5,000+/month depending on volume and integration complexity.
4. **Usage:** add per-ticket, per-document, per-shipment, or per-action billing when the unit of value is unambiguous.
5. **Enterprise:** implementation fee + annual/monthly contract after ROI is demonstrated.

Outcome-based pricing is particularly credible for support because the market already prices some AI agents per resolved conversation; hybrid subscription + usage is also established.

## First 3 experiments

### Experiment A — Support Resolution Engine
Build a provider-neutral mini app that accepts a ticket and returns:
- intent/category
- customer/order context from mock data
- policy-grounded answer
- confidence score
- human escalation decision
- draft response

**Success gate:** process 100 synthetic tickets and measure classification accuracy, safe-resolution rate, latency, and estimated cost per resolved ticket.

### Experiment B — Invoice/PO Exception Engine
Input invoice text + PO JSON. Extract fields, normalize supplier/amount/date, compare to PO, and produce `MATCH`, `REVIEW`, or `REJECT` with reasons.

**Success gate:** 100 synthetic documents; measure field accuracy, match accuracy, review rate, and estimated labor saved.

### Experiment C — RFQ-to-Quote Engine
Input a customer RFQ email/PDF text. Extract SKU/quantity/specification/deadline, identify missing information, and produce a structured quote draft for human approval.

**Success gate:** 50 synthetic RFQs; measure extraction accuracy, missing-field detection, quote preparation time, and error rate.

## Sales math

A simple pilot offer can be framed as:

`Monthly customer cost = volume × current manual cost/unit`

`Expected savings = avoidable manual cost + error/rework cost + protected revenue`

`Pilot price <= 20–30% of conservative first-year value` is a starting commercial heuristic, not a universal rule.

Example: 5,000 tickets/month × $4 avoidable handling cost = $20,000/month baseline. If a pilot safely resolves 30% without human handling, gross avoidable labor value is roughly $6,000/month before implementation/API costs. A $1,000–$2,000 pilot becomes economically testable.

## Important constraint

Do not claim customer savings before measuring the customer's baseline. Public AI ROI figures are heterogeneous and many are vendor-reported. The lab must measure each workflow using a baseline, controlled test set, API cost, latency, failure modes, and human-review rate.

## Definition of done for an opportunity

An opportunity graduates only when we have:
- a working demo
- a reproducible test set
- measured KPI
- estimated unit economics
- buyer persona
- pilot scope
- pricing hypothesis
- list of integration requirements
- failure/safety boundary
- a one-page sales proposition

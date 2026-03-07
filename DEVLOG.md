# Development Log

This file tracks development sessions, decisions, and context for continuity across time and collaborators.

---

## Project Status

Current State: Initial scan and framing
Primary Goal: Field engineering dashboard for API 675 pump troubleshooting and sizing
Tech Stack: React + Vite

---

## Quick Context for New Sessions

- App structure: tabbed dashboard (Suction & Ha, Discharge, Calibration, Troubleshooting)
- UI is present; domain model and calculation rules need explicit documentation
- Use this log to preserve the evolving model and decision history

---

## Conceptual Model (Initial)

System Model:
- Pump system with suction conditions, discharge conditions, and calibration/dosing behavior
- Troubleshooting matrix that maps symptoms to root causes and actions

Inputs (expected):
- Fluid properties (SG, temperature, vapor pressure)
- Suction pressure, elevation, line losses
- Discharge pressure, flow rate, head
- Pump geometry / model parameters
- Calibration settings (stroke length, speed, capacity)

Outputs (expected):
- NPSHa / suction margin
- Head, performance, efficiency
- Dosing rate and calibration adjustments
- Troubleshooting guidance

Constraints and Rules to Confirm:
- API 675 compliance assumptions
- Unit system and conversion rules
- Valid ranges and failure thresholds
- Required minimum inputs for each calculation path

Failure Modes / Breakpoints:
- Missing or inconsistent units
- Out-of-range physical values
- Insufficient data to compute NPSHa or dosing

Optimization Levers:
- Clear input validation
- Fast feedback with sensible defaults
- Traceable formula references

---

## Initial Tasks (Model-First)

- Map components to model: list each tab, its inputs, outputs, and formulas
- Define the minimum input set for each tab to produce a valid result
- Document constraints, breakpoints, and validation rules per tab
- Identify and document formula sources (manual sections, references)
- Add a small set of test cases for each tab (expected inputs/outputs)
- Capture any known edge cases or unsupported configurations

---

## Session Notes

- None yet

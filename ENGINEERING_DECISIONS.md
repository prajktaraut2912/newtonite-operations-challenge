# Engineering Decisions

## 1. Project Overview

Newtonite Operations Challenge is a task-management application designed to manage operational tasks, track priorities, assign ownership, and maintain activity history.

## 2. Initial Technology Choice

The initial user interface is built using HTML, CSS, and JavaScript.

- HTML defines the structure of the application.
- CSS provides the layout and visual styling.
- JavaScript handles task creation, status updates, and activity history.

## 3. Task Management

Each task contains a title, assigned owner, priority, and status. Users can create tasks and update their status.

## 4. Data Storage

The initial prototype uses browser localStorage to retain tasks and activity history between page reloads in the same browser.

This is a prototype decision, not a replacement for a shared database in a full-stack application.

## 5. Future Improvements

- Add a backend API and database.
- Implement input validation and error handling.
- Add automated tests.
- Improve accessibility and responsive design.
- Implement authentication and authorization if required by the assignment.

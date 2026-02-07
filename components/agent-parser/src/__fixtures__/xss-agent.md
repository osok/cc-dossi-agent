---
name: <script>alert('xss')</script>
description: <img onerror="alert(1)" src=x>
tools:
  - <script>alert('tool-xss')</script>
  - Read
---

## Behavior

This agent tests XSS handling. Content: <script>document.cookie</script>

## Outputs

- <img src=x onerror="alert('xss')">

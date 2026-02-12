import logging
import asyncio
from pathlib import Path
from typing import Dict, Optional, List
from playwright.async_api import async_playwright, Page, Browser, Playwright

logger = logging.getLogger(__name__)

class BrowserAutomationService:
    """
    Service for automating browser interactions using Playwright.
    Currently supports filling out standard job application forms (Greenhouse, Lever).
    """

    def __init__(self):
        self.headless = False  # Set to False for debugging/demo purposes

    async def _fill_input_by_label(self, page: Page, label_texts: List[str], value: str):
        """
        Attempts to fill an input field by finding a label containing one of the label_texts.
        """
        for text in label_texts:
            try:
                # specific to greenhouse/lever structure often, or generic HTML
                # Strategy 1: strict label text match
                # get_by_label is robust but requires exact text or fuzzy match. 
                # We'll use a locator for the label and then find the associated input.
                
                # Try Playwright's smart get_by_label
                await page.get_by_label(text, exact=False).fill(value)
                logger.info(f"Filled field for '{text}' with '{value}'")
                return True
            except Exception:
                continue
        
        # Fallback: Try specific IDs often used in these forms
        # This is a basic heuristic; a more advanced version would use LLM to parse the DOM.
        return False

    async def apply_to_job(self, job_url: str, user_data: Dict[str, str], resume_path: str = None) -> Dict:
        """
        Main entry point to apply to a job.
        Detects the ATS type (Greenhouse, Lever, etc.) and calls the appropriate filler.
        """
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=self.headless, slow_mo=50)
            context = await browser.new_context()
            page = await context.new_page()

            try:
                logger.info(f"Navigating to {job_url}")
                await page.goto(job_url, wait_until="networkidle")

                # Detect ATS
                if "greenhouse.io" in page.url or "gh_jid" in page.url:
                    result = await self._fill_greenhouse(page, user_data, resume_path)
                elif "lever.co" in page.url:
                    result = await self._fill_lever(page, user_data, resume_path)
                else:
                    logger.warning("Unknown ATS. Attempting generic fill.")
                    result = await self._fill_generic(page, user_data, resume_path)
                
                # await page.pause() # Uncomment to debug manually
                
                # We don't submit automatically in this V1 for safety. 
                # We leave the browser open or take a screenshot? 
                # For a headless service, we usually submit. 
                # For V1, let's submit if confident, or just return success.
                # Since we close the browser at the end of the 'with' block, we can't "leave it open" easily 
                # unless we run a separate session. 
                # ideally, we would return a screenshot of the filled form.
                
                screenshot_path = f"output/screenshot_{Path(job_url).name}.png"
                await page.screenshot(path=screenshot_path)
                
                return {
                    "status": "success" if result else "partial_success", 
                    "message": "Form filled (not submitted)",
                    "screenshot": screenshot_path
                }

            except Exception as e:
                logger.error(f"Error applying to job: {str(e)}")
                return {"status": "error", "message": str(e)}
            finally:
                await browser.close()

    async def _fill_greenhouse(self, page: Page, data: Dict, resume_path: str = None) -> bool:
        """
        Fills a Greenhouse.io application form.
        """
        logger.info("Detected Greenhouse form.")
        
        # 1. Personal Info
        await page.get_by_label("First Name").fill(data.get("first_name", ""))
        await page.get_by_label("Last Name").fill(data.get("last_name", ""))
        await page.get_by_label("Email").fill(data.get("email", ""))
        await page.get_by_label("Phone").fill(data.get("phone", ""))
        
        # 2. LinkedIn
        # Greenhouse often has 'LinkedIn Profile'
        try:
            await page.get_by_label("LinkedIn Profile").fill(data.get("linkedin", ""))
        except:
            pass # Optional
            
        # 3. Resume Upload
        # Look for input[type=file] usually associated with "Resume/CV"
        if resume_path and Path(resume_path).exists():
            try:
                # Greenhouse usually has an id like 'resume' or 'file' inside a container
                # We can try to locate the file input directly.
                # Often: input[id="resume_fieldset"] or similar? No, usually input[type=file]
                
                # Try generic file locator or specific label
                file_input = page.locator("input[type='file']").first
                await file_input.set_input_files(resume_path)
                logger.info(f"Uploaded resume from {resume_path}")
            except Exception as e:
                logger.error(f"Failed to upload resume: {e}")
        
        return True

    async def _fill_lever(self, page: Page, data: Dict, resume_path: str = None) -> bool:
        """
        Fills a Lever.co application form.
        """
        logger.info("Detected Lever form.")
        
        # Lever usually uses name attributes or specific classes
        try:
            await page.fill("input[name='name']", f"{data.get('first_name', '')} {data.get('last_name', '')}")
            await page.fill("input[name='email']", data.get("email", ""))
            await page.fill("input[name='phone']", data.get("phone", ""))
            await page.fill("input[name='urls[LinkedIn]']", data.get("linkedin", ""))
        except Exception as e:
            logger.warning(f"Lever fill issue: {e}")

        if resume_path and Path(resume_path).exists():
            try:
                await page.set_input_files("input[type='file']", resume_path)
            except Exception as e:
                logger.error(f"Failed to upload resume on Lever: {e}")
                
        return True

    async def _fill_generic(self, page: Page, data: Dict, resume_path: str = None) -> bool:
        """
        Best-effort generic form filler.
        """
        logger.info("Attempting generic form fill.")
        
        # Try standard labels
        await self._fill_input_by_label(page, ["First Name", "First name"], data.get("first_name", ""))
        await self._fill_input_by_label(page, ["Last Name", "Last name"], data.get("last_name", ""))
        await self._fill_input_by_label(page, ["Email", "Email Address"], data.get("email", ""))
        await self._fill_input_by_label(page, ["Phone", "Mobile"], data.get("phone", ""))
        await self._fill_input_by_label(page, ["LinkedIn", "LinkedIn Profile"], data.get("linkedin", ""))
        
        if resume_path and Path(resume_path).exists():
            try:
                await page.locator("input[type='file']").first.set_input_files(resume_path)
            except:
                pass
                
        return True

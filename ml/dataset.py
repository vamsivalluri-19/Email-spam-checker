import csv
import random
import os

def generate_spam_email():
    categories = [
        "phishing", "crypto", "marketing", "pharmacy", "lottery", "invoice"
    ]
    category = random.choice(categories)
    
    greetings = [
        "Dear Customer,", "Dear Winner,", "Congratulations!", "ATTENTION:", "Urgent Notification,",
        "Dear Friend,", "Valued Member,", "Dear Account Owner,", "Hello,", "URGENT:", "Important Notice:"
    ]
    
    if category == "phishing":
        subjects = [
            "Your account has been temporarily locked", "Suspicious activity detected on your account",
            "Urgent: Verify your billing information", "Security Alert: Unusual login attempt",
            "Reset your password immediately", "Action Required: Update your credentials"
        ]
        bodies = [
            "We detected a login attempt from a new device in a different country. For security reasons, we have temporarily restricted your access.",
            "Our billing department was unable to process your monthly subscription payment. Please update your payment method to avoid service interruption.",
            "An unauthorized transaction was requested from your online banking account. If this was not you, please secure your account immediately.",
            "Your cloud storage account is running out of space and backup services have been suspended. Verify your storage plan now.",
            "As part of our annual system upgrade, all users are required to confirm their security credentials. Failure to do so will result in email deletion."
        ]
        calls_to_action = [
            "Click here to unlock your account: http://secure-login-portal.net/verify",
            "Update your billing profile at: http://billing-update-service.org",
            "Download the attached security patch and run it to secure your files.",
            "Please verify your identity here: http://account-verification-online.com/auth",
            "Click this link to confirm your credentials: http://system-update-mail.com"
        ]
    elif category == "invoice":
        subjects = [
            "Invoice #87920 for your Geek Squad service", "Order confirmation for Norton Antivirus renewal",
            "PayPal: You sent a payment of $649.99 USD to Coinbase Inc.", "Receipt for your recent Amazon purchase",
            "Your invoice is ready for payment", "Subscription auto-renewal notification"
        ]
        bodies = [
            "Thank you for your business. Your automatic renewal payment of $499.99 for Geek Squad Premium support has been successfully charged.",
            "We have successfully renewed your antivirus license for the next 3 years. The fee of $299.99 has been billed to your card on file.",
            "This email confirms your payment of $649.99 to Coinbase Inc. using your PayPal account balance. The transaction will appear on your statement shortly.",
            "Your membership has been automatically upgraded to premium level. The payment of $199.99 will be deducted from your registered account.",
            "Please find attached your invoice for services rendered during the last billing cycle. Payment is due within 5 business days."
        ]
        calls_to_action = [
            "If you did not authorize this charge, call our support desk immediately at +1-800-555-0199.",
            "To dispute this invoice or request a refund, visit: http://invoice-dispute-help.com",
            "Click here to download your detailed PDF statement: http://billing-statements-online.net",
            "Cancel your auto-renewal by logging in here: http://cancel-subscription-direct.org",
            "Review transaction history by clicking: http://paypal-transaction-portal.com"
        ]
    elif category == "crypto":
        subjects = [
            "Claim your 5,000 USDT free Airdrop!", "Exclusive Bitcoin investment opportunity - 200% returns",
            "Double your Ethereum in 24 hours - guaranteed", "The next big meme coin is launching - buy now",
            "Your crypto portfolio has been credited with free tokens", "Learn how to make $10,000/month with crypto trading"
        ]
        bodies = [
            "To celebrate our platform milestone, we are distributed free tokens to random email users. Don't miss out on your free digital assets.",
            "Our automated AI trading algorithm has been consistently generating 5% daily returns. Invest today and start earning passive income.",
            "This is a limited-time opportunity to join our exclusive VIP crypto investment club. Only 50 slots remaining.",
            "Our researchers have identified the next cryptocurrency that is set to skyrocket by 10,000% next week. Early access is open now.",
            "We have initiated an automatic distribution of our new utility token. Sign up to claim your share before the offer expires."
        ]
        calls_to_action = [
            "Connect your wallet and claim your tokens at: http://free-token-airdrop.net",
            "Start your investment with as little as $100: http://crypto-wealth-growth.com",
            "Register for the presale today: http://meme-coin-presale.org",
            "Get access to the trading bot here: http://ai-trading-signals.com",
            "Reply to this email with your crypto wallet address to receive your tokens."
        ]
    elif category == "marketing":
        subjects = [
            "Get pre-approved for a 0% interest loan", "Lower your mortgage rates today!",
            "Save up to 75% on our premium services", "Lose 10 pounds in 1 week with our natural pills!",
            "Cheap online shopping deals - limited time", "Get cash back on all your online purchases"
        ]
        bodies = [
            "Are you struggling with debt? We offer fast, easy debt consolidation loans with low interest rates. No credit check required.",
            "Lower your monthly home payments significantly by refinancing your mortgage today. Rates have reached historic lows.",
            "Introduce our new dietary supplement that burns fat while you sleep. Clinically tested and recommended by top doctors.",
            "Get high-quality replica watches and luxury brand items at a fraction of the cost. Free shipping on all orders.",
            "Earn cash back every time you shop at your favorite online stores. Sign up to get a free $10 registration bonus."
        ]
        calls_to_action = [
            "Apply in just 3 minutes at: http://unsecured-loans-quick.com",
            "Calculate your new mortgage rate here: http://refinance-your-home.net",
            "Order your trial bottle today: http://slim-burn-diet.org",
            "Browse our luxury catalog now: http://luxury-replicas-direct.com",
            "Create your free account today: http://cashback-rewards-portal.org"
        ]
    elif category == "pharmacy":
        subjects = [
            "Order cheap Viagra & Cialis online - no prescription", "Save big on prescription medications",
            "Fast international shipping on medical supplies", "Discount pharmacy deals - get yours now",
            "Your online pharmacy prescription is ready"
        ]
        bodies = [
            "Buy generic drugs online from the comfort of your home. We offer maximum privacy and secure credit card payments.",
            "Stop paying retail prices for your daily prescriptions. We match and beat any online pharmacy prices.",
            "We have all generic medications in stock, including sleep aids, pain relievers, and muscle relaxers.",
            "Join our pharmacy club today and get a permanent 15% discount on all health and wellness products.",
            "Order authentic medications manufactured in FDA-approved facilities with discreet packaging."
        ]
        calls_to_action = [
            "Shop our online pharmacy now: http://rx-pharmacy-deals.com",
            "Get free shipping on orders over $50: http://pill-shop-direct.org",
            "Click here to order without prescription: http://easy-meds-online.net",
            "Choose your package size here: http://generic-rx-deals.com",
            "Reply 'ORDER' to receive a customized quote."
        ]
    else: # lottery
        subjects = [
            "You have won $1,500,000 in our international drawing!", "Congratulations: You are our selected winner",
            "Unclaimed funds notification - claim your inheritance", "Your email address won a lottery prize!",
            "Official notification: Cash prize payout"
        ]
        bodies = [
            "Your email address was drawn as the winner of the grand prize in our promotional sweepstakes. The funds have been held in escrow.",
            "We are contact you regarding an unclaimed estate of a deceased relative who shares your last name. We need your cooperation to file a claim.",
            "You have been selected as the winner of a brand new luxury vehicle and $50,000 cash. Claim details are attached.",
            "The international lottery foundation has approved your cash release. Please confirm your receipt.",
            "This is an official transaction announcement. Your prize money is ready for bank wire transfer."
        ]
        calls_to_action = [
            "To file your claim, contact our claims agent: http://lottery-claims-agent.net",
            "Send your full banking details to confirm transfer.",
            "Claim your prize online by entering code 'WINNER': http://claim-draw-cash.org",
            "Reply to this email with your name, phone number, and physical address.",
            "Download the claim form: http://inheritance-fund-transfer.net/forms"
        ]
        
    sign_offs = [
        "Regards,\nCustomer Support Team", "Best Wishes,\nLottery Coordinators", "Sincerely,\nSecurity Division",
        "Cheers,\nWealth Advisors", "Thanks,\nShipping Department", "Yours truly,\nCustomer Care Agent",
        "Best regards,\nAccounts Department", "Sincerely,\nDispute Division"
    ]
    
    email_text = f"Subject: {random.choice(subjects)}\n\n{random.choice(greetings)}\n\n{random.choice(bodies)}\n\n{random.choice(calls_to_action)}\n\n{random.choice(sign_offs)}"
    return email_text

def generate_ham_email():
    categories = [
        "work", "school", "personal", "transaction", "notification"
    ]
    category = random.choice(categories)
    
    greetings = [
        "Hi John,", "Hi Team,", "Hello Sarah,", "Dear Professor,", "Hey Alex,",
        "Good morning,", "Hi all,", "Dear Vamsi,", "Hey,", "Hello,", "Hi,"
    ]
    
    if category == "work":
        subjects = [
            "Project status update", "Minutes from today's meeting", "Review requested on pull request",
            "Weekly report submission", "Can we reschedule our sync?", "Draft agenda for next week's conference",
            "Q3 planning alignment", "Feedback on the design mockup", "Server migration schedule"
        ]
        bodies = [
            "I wanted to let you know that we completed the database migration successfully. All systems are functioning normally and performance is stable.",
            "Thanks for attending our sync today. Here is the summary of what we discussed and the action items for each owner going forward.",
            "I have submitted the pull request for the new authentication middleware. Please review the changes and let me know your thoughts.",
            "Please find attached the weekly sales report for your review. We saw a 12% increase in user engagement this week.",
            "I have a conflict tomorrow at 2 PM. Would you be open to pushing our weekly sync to Thursday morning instead?",
            "Here is the draft agenda for the upcoming tech workshop. Please add any topics you'd like to present by Friday.",
            "We need to align on the deliverables for Q3. I've set up a brief 30-minute call for us on Monday morning.",
            "The design feedback from the client is in. They liked the color palette but requested some changes to the hero section layout.",
            "The DevOps team is scheduling the production server migration for Friday at 11 PM EST. Expect 15 minutes of read-only state."
        ]
    elif category == "school":
        subjects = [
            "Question about the homework assignment", "Assignment submission: Project Phase 1",
            "Syllabus query", "Rescheduling office hours", "Group project coordination meeting",
            "Exam preparation guide", "Grades updated on portal"
        ]
        bodies = [
            "I was working on the math problems and got stuck on question 3. Could you clarify if we need to apply the chain rule?",
            "Please find attached my submission for Phase 1 of the software engineering project. Let me know if you need any additional files.",
            "I noticed a conflict in the reading list dates on the syllabus. Is the chapter 4 review due this Thursday or next?",
            "Due to a department meeting, I will be moving my office hours tomorrow from 3 PM to 5 PM. Zoom link remains the same.",
            "Let's meet tomorrow in the library study room at 1 PM to outline our slides for the final presentation.",
            "I've uploaded the study guide for the upcoming midterm exam. It covers chapters 1 through 5, focusing on algorithm complexities.",
            "Your grade for the midterm essay has been published. Let me know if you would like to discuss the feedback."
        ]
    elif category == "personal":
        subjects = [
            "Lunch tomorrow?", "Congratulations on your promotion!", "Checking in",
            "Weekend plans", "Photos from the trip", "Happy Birthday!",
            "Recipe from dinner", "Movie night this Friday"
        ]
        bodies = [
            "Are you free to grab lunch tomorrow around 12:30 PM? Let me know if that works or if you prefer a different time.",
            "I heard the news about your promotion to Tech Lead. Truly well deserved, and I am excited to see your work in this new role!",
            "It's been a while since we caught up. How have you been? Let's get together for coffee sometime next week.",
            "Are you planning to go hiking this Saturday? The weather forecast looks great and a few of us are heading up the trail.",
            "I finally uploaded all the photos from our camping trip last weekend. Here is the shared drive link to view them.",
            "Wishing you a fantastic birthday today! Hope you have a wonderful celebration with family and friends.",
            "Here is the recipe for the garlic herb pasta I made yesterday. It's super easy to prepare and takes less than 30 minutes.",
            "We are planning to watch the new sci-fi film this Friday evening at the theater. Let me know if you want me to reserve a ticket for you."
        ]
    elif category == "transaction":
        subjects = [
            "Receipt for your subscription renewal", "Your order has been shipped",
            "Booking confirmation: Flight AI-402", "Hotel reservation confirmed",
            "Monthly invoice for cloud utilities", "Your deposit was received"
        ]
        bodies = [
            "Your payment for the premium monthly plan was processed successfully. Thank you for your continued support.",
            "Good news! Your order #90281 has been packaged and shipped. You can track your delivery progress using the provided link.",
            "This is your official booking confirmation for your flight to San Francisco. Check-in opens 24 hours prior to departure.",
            "We are pleased to confirm your reservation at the Grand Central Hotel. Your check-in date is scheduled for July 15.",
            "Your statement for cloud hosting usage is now available. The total charge has been automatically billed to your bank account.",
            "We confirm receipt of your deposit into your savings account. The transaction has been cleared and is visible in your mobile app."
        ]
    else: # notification
        subjects = [
            "New message on your profile", "Weekly newsletter: Tech Trends",
            "Calendar reminder: Dentist appointment", "Security update: Password changed",
            "Daily summary report", "Weather alert for your area"
        ]
        bodies = [
            "You have received a new direct message from a connected member. Log in to your inbox to read and reply.",
            "In this week's issue, we cover the latest developments in generative AI models, vector databases, and quantum computing.",
            "This is a reminder that you have a dental check-up scheduled for tomorrow at 10 AM. Please arrive 10 minutes early.",
            "This notification confirms that the password for your developer account was successfully changed. If you did not make this change, contact us.",
            "Here is the digest of today's activities on your workspace. 14 comments were resolved and 3 new tasks were created.",
            "The national weather service has issued a heavy rain warning for your region. Stay safe and avoid unnecessary travel."
        ]
        
    follow_ups = [
        "Let me know if you have any questions or concerns.",
        "Looking forward to hearing from you soon.",
        "Let's catch up later this week.",
        "Please review and approve by EOD.",
        "Have a great evening!",
        "Let me know if this schedule works for you.",
        "Thank you for your hard work on this.",
        "See you tomorrow!",
        "Best of luck with the presentation.",
        "Let's finalize this draft tomorrow morning."
    ]
    
    sign_offs = [
        "Best regards,\nMichael", "Thanks,\nDavid", "Sincerely,\nEmily",
        "Warmly,\nJessica", "Best,\nRobert", "Cheers,\nDaniel",
        "Thanks,\nHR Team", "Regards,\nBilling Department", "Best regards,\nSupport Staff"
    ]
    
    email_text = f"Subject: {random.choice(subjects)}\n\n{random.choice(greetings)}\n\n{random.choice(bodies)}\n\n{random.choice(follow_ups)}\n\n{random.choice(sign_offs)}"
    return email_text

def create_dataset(output_path, num_samples=3200):
    os.makedirs(os.path.dirname(output_path), exist_ok=True) if os.path.dirname(output_path) else None
    
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["text", "label"])
        
        # Generate balanced dataset
        half_samples = num_samples // 2
        
        # Keep track of generated emails to ensure uniqueness
        generated = set()
        
        # Generate SPAM
        spam_count = 0
        while spam_count < half_samples:
            email = generate_spam_email()
            if email not in generated:
                generated.add(email)
                writer.writerow([email, "spam"])
                spam_count += 1
                
        # Generate HAM
        ham_count = 0
        while ham_count < half_samples:
            email = generate_ham_email()
            if email not in generated:
                generated.add(email)
                writer.writerow([email, "ham"])
                ham_count += 1
                
    print(f"Dataset generated at {output_path} with {num_samples} samples ({spam_count} spam, {ham_count} ham).")

if __name__ == "__main__":
    create_dataset("spam_dataset.csv", 3200)

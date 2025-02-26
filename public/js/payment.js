document.addEventListener("DOMContentLoaded", function () {
    const paymentButton = document.getElementById("rzp-button1");

    if (paymentButton) {
        paymentButton.addEventListener("click", async function (e) {
            e.preventDefault();

            const listingId = paymentButton.getAttribute("data-listing-id");
            const userId = paymentButton.getAttribute("data-user-id");
            const bookingDate = document.getElementById("bookingDate")?.value || "";

            console.log("✅ Button Clicked!");
            console.log("🔍 Listing ID:", listingId);
            console.log("🔍 User ID:", userId);
            console.log("🔍 Booking Date:", bookingDate);

            if (!bookingDate) {
                alert("Please select a booking date before proceeding.");
                return;
            }

            try {
                alert("Redirecting to payment gateway... Please do not refresh the page.");

                const response = await fetch("https://music-studio-yuyo.onrender.com/payment/create-order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ listingId, userId, bookingDate })
                });

                const order = await response.json();
                console.log("🛒 Order Response:", order);

                if (order.error) {
                    document.getElementById("error-message").innerText = order.error;
                    document.getElementById("error-message").style.display = "block";
                    return;
                }

                const options = {
                    key: "rzp_test_6BEHReutgiWrJP",
                    amount: order.amount * 100, // Convert to paise
                    currency: "INR",
                    name: "Music Studio",
                    description: "Payment for booking",
                    order_id: order.order_id, // Corrected order ID
                    handler: async function (response) {
                        console.log("💳 Payment Successful!", response);

                        try {
                            const verifyResponse = await fetch("https://music-studio-yuyo.onrender.com/payment/verify-payment", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    listingId,
                                    userId,
                                    bookingDate,
                                    amount: order.amount
                                })
                            });

                            const result = await verifyResponse.json();
                            console.log("✅ Payment Verification Response:", result);

                            if (result.success) {
                                alert(result.message);
                                window.location.href = `/user-bookings/${userId}`;
                            } else {
                                alert(result.error || "Payment verification failed");
                            }
                        } catch (error) {
                            console.error("❌ Payment Verification Error:", error);
                            alert("Payment verification failed. Please try again.");
                        }
                    },
                    prefill: {
                        name: paymentButton.getAttribute("data-user-name"),
                        email: paymentButton.getAttribute("data-user-email")
                    },
                    theme: { color: "#3399cc" }
                };

                console.log("🚀 Initializing Razorpay...");
                const rzp1 = new Razorpay(options);
                rzp1.open();
            } catch (error) {
                console.error("❌ Payment Error:", error);
                alert("Something went wrong. Please try again.");
            }
        });
    } else {
        console.error("❌ Payment button not found in DOM!");
    }
});

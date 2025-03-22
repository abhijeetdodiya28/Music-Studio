document.addEventListener("DOMContentLoaded", function () {
    const paymentButton = document.getElementById("rzp-button1");

    if (!paymentButton) return;

    paymentButton.addEventListener("click", async function (e) {
        e.preventDefault();

        const listingId = paymentButton.dataset.listingId;
        const userId = paymentButton.dataset.userId;
        const bookingDate = document.getElementById("bookingDate").value;

        if (!bookingDate) {
            alert("Please select a booking date before proceeding.");
            return;
        }

        try {
            alert("Redirecting to payment gateway... Please do not refresh the page.");

            const response = await fetch("/payment/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ listingId, userId, bookingDate })
            });

            const order = await response.json();
            if (order.error) {
                displayError(order.error);
                return;
            }

            const options = {
                key: "rzp_test_bjjX6XSeJCfsmU",
                amount: order.amount * 100,
                currency: "INR",
                name: "Music Studio",
                description: "Payment for booking",
                order_id: order.order_id,
                handler: async function (response) {
                    await verifyPayment(response, listingId, userId, bookingDate, order.amount);
                },
                prefill: {
                    name: paymentButton.dataset.userName,
                    email: paymentButton.dataset.userEmail
                },
                theme: { color: "#3399cc" }
            };

            new Razorpay(options).open();
        } catch (error) {
            console.error("Payment Error:", error);
            alert("Something went wrong. Please try again.");
        }
    });

    async function verifyPayment(response, listingId, userId, bookingDate, amount) {
        try {
            const verifyResponse = await fetch("/payment/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    listingId,
                    userId,
                    bookingDate,
                    amount
                })
            });

            const result = await verifyResponse.json();
            if (result.success) {
                alert(result.message);
                window.location.href = `/user-bookings/${userId}`;
            } else {
                displayError(result.error || "Payment verification failed");
            }
        } catch (error) {
            console.error("Verification Error:", error);
            alert("Payment verification failed. Please try again.");
        }
    }

    function displayError(message) {
        const errorMessage = document.getElementById("error-message");
        if (errorMessage) {
            errorMessage.innerText = message;
            errorMessage.style.display = "block";
        } else {
            alert(message);
        }
    }
});

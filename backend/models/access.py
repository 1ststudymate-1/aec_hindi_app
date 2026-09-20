"""Access and billing API models; mirrored in frontend/src/lib/access.ts."""
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field


class UserView(BaseModel):
    user_id: str
    name: str
    email: str
    picture: str = ""
    has_access: bool
    access_until: datetime | None = None
    access_mode: Literal["live", "test", "admin"] | None = None


class AuthState(BaseModel):
    user: UserView | None = None


class SessionExchange(BaseModel):
    session_id: str = Field(min_length=8, max_length=512)


class Message(BaseModel):
    message: str


class AdminUnlock(BaseModel):
    password: str = Field(min_length=1, max_length=200)


class Plan(BaseModel):
    amount: int = 34900
    currency: str = "INR"
    months: int = 6
    enabled: bool
    mode: Literal["disabled", "test", "live"]


class OrderView(BaseModel):
    order_id: str
    key_id: str
    amount: int
    currency: str
    mode: Literal["test", "live"]


class PaymentVerification(BaseModel):
    razorpay_order_id: str = Field(pattern=r"^order_[A-Za-z0-9]+$", max_length=100)
    razorpay_payment_id: str = Field(pattern=r"^pay_[A-Za-z0-9]+$", max_length=100)
    razorpay_signature: str = Field(pattern=r"^[a-f0-9]{64}$")
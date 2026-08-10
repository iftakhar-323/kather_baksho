# Step 1: Build stage
FROM golang:alpine AS builder

# Install build dependencies for CGO (SQLite)
RUN apk add --no-cache gcc musl-dev build-base

WORKDIR /app

# Copy go module files and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the Go application binary with CGO enabled
ENV CGO_ENABLED=1
ENV GOOS=linux
RUN go build -ldflags="-w -s" -o katherbox main.go

# Build seed tools (optional helper binaries)
RUN go build -ldflags="-w -s" -o seedusers ./cmd/resetusers
RUN go build -ldflags="-w -s" -o seedproducts ./cmd/seedproducts
RUN go build -ldflags="-w -s" -o seeddummy ./cmd/seeddummy

# Step 2: Final runtime stage
FROM alpine:3.20

RUN apk add --no-cache ca-certificates sqlite-libs tzdata

WORKDIR /app

# Create directory for persistent SQLite DB volume
RUN mkdir -p /app/data

# Copy compiled binaries from builder stage
COPY --from=builder /app/katherbox /app/
COPY --from=builder /app/seedusers /app/
COPY --from=builder /app/seedproducts /app/
COPY --from=builder /app/seeddummy /app/

# Environment defaults
ENV PORT=8081
ENV DB_PATH=/app/data/katherbox.db
ENV GIN_MODE=release

EXPOSE 8081

# Command to run backend
CMD ["/app/katherbox"]

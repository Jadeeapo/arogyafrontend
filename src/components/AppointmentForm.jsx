import axios from "axios";
import React, { useEffect } from "react";
import { useState } from "react";
import { toast } from "react-toastify";
import { FaUser, FaCalendar, FaStethoscope, FaMapMarkerAlt, FaPhone, FaEnvelope } from "react-icons/fa";
import "./AppointmentForm.css";

const AppointmentForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    nic: "",
    dob: "",
    gender: "",
    appointmentDate: "",
    appointmentTime: "",
    department: "Pediatrics",
    doctorFirstName: "",
    doctorLastName: "",
    address: "",
    hasVisited: false,
  });

  const [errors, setErrors] = useState({});
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // Multi-step form
  const [touched, setTouched] = useState({});

  const departmentsArray = [
    "Pediatrics",
    "Orthopedics",
    "Cardiology",
    "Neurology",
    "Oncology",
    "Radiology",
    "Physical Therapy",
    "Dermatology",
    "ENT",
  ];

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:4000/api/v1/user/doctors"
      );
      setDoctors(data.doctors || []);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast.error("Failed to load doctors");
    }
  };

  // Step-specific validation
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      // Personal Information validation
      if (!formData.firstName.trim()) {
        newErrors.firstName = "First name is required";
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = "Last name is required";
      }
      if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        newErrors.email = "Valid email is required (e.g., john@example.com)";
      }
      if (!formData.phone.match(/^[0-9]{10,}$/)) {
        newErrors.phone = "Valid phone number required (10+ digits)";
      }
      if (!formData.dob) {
        newErrors.dob = "Date of birth is required";
      }
      if (!formData.gender) {
        newErrors.gender = "Please select your gender";
      }
    }

    if (step === 2) {
      // Appointment Details validation
      if (!formData.nic.trim()) {
        newErrors.nic = "NIC is required";
      }
      if (!formData.address.trim()) {
        newErrors.address = "Address is required";
      }
      if (!formData.department) {
        newErrors.department = "Please select a department";
      }
      if (!formData.doctorFirstName) {
        newErrors.doctor = "Please select a doctor";
      }
    }

    if (step === 3) {
      // Appointment Timing validation
      if (!formData.appointmentDate) {
        newErrors.appointmentDate = "Appointment date is required";
      }
      if (!formData.appointmentTime) {
        newErrors.appointmentTime = "Appointment time is required";
      }
      if (formData.appointmentDate && formData.appointmentTime) {
        const selectedDateTime = new Date(`${formData.appointmentDate}T${formData.appointmentTime}`);
        if (selectedDateTime < new Date()) {
          newErrors.appointmentDateTime = "Please select a future date and time";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const handleDepartmentChange = (e) => {
    setFormData(prev => ({
      ...prev,
      department: e.target.value,
      doctorFirstName: "",
      doctorLastName: "",
    }));
    setTouched(prev => ({ ...prev, department: true }));
  };

  const handleDoctorChange = (e) => {
    const { firstName, lastName } = JSON.parse(e.target.value);
    setFormData(prev => ({
      ...prev,
      doctorFirstName: firstName,
      doctorLastName: lastName,
    }));
    setTouched(prev => ({ ...prev, doctor: true }));
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      toast.error("Please fill in all required fields correctly");
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAppointment = async (e) => {
    e.preventDefault();

    if (!validateStep(3)) {
      toast.error("Please complete all fields");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(
        "http://localhost:4000/api/v1/appointment/post",
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          nic: formData.nic,
          dob: formData.dob,
          gender: formData.gender,
          appointment_date: `${formData.appointmentDate}T${formData.appointmentTime}`,
          department: formData.department,
          doctor_firstName: formData.doctorFirstName,
          doctor_lastName: formData.doctorLastName,
          hasVisited: formData.hasVisited,
          address: formData.address,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      toast.success(data.message);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        nic: "",
        dob: "",
        gender: "",
        appointmentDate: "",
        appointmentTime: "",
        department: "Pediatrics",
        doctorFirstName: "",
        doctorLastName: "",
        address: "",
        hasVisited: false,
      });
      setCurrentStep(1);
      setTouched({});
      setErrors({});
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to book appointment");
    } finally {
      setLoading(false);
    }
  };

  const availableDoctors = doctors.filter(
    doctor => doctor.doctorDepartment === formData.department
  );

  // Calculate form completion percentage
  const getStepCompletion = () => {
    if (currentStep === 1) return 33;
    if (currentStep === 2) return 66;
    return 100;
  };

  return (
    <>
      <div className="appointment-form-container">
        <div className="form-wrapper">
          {/* Progress Header */}
          <div className="progress-section">
            <div className="progress-header">
              <h2>Book Your Appointment</h2>
              <p className="step-indicator">Step {currentStep} of 3</p>
            </div>

            {/* Progress Bar */}
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${getStepCompletion()}%` }}
              ></div>
            </div>

            {/* Step Indicators */}
            <div className="steps-indicator">
              <div className={`step ${currentStep >= 1 ? "active" : ""}`}>
                <div className="step-number">
                  {currentStep > 1 ? "✓" : "1"}
                </div>
                <p>Personal Info</p>
              </div>
              <div className={`step ${currentStep >= 2 ? "active" : ""}`}>
                <div className="step-number">
                  {currentStep > 2 ? "✓" : "2"}
                </div>
                <p>Medical Details</p>
              </div>
              <div className={`step ${currentStep >= 3 ? "active" : ""}`}>
                <div className="step-number">3</div>
                <p>Schedule</p>
              </div>
            </div>
          </div>

          {/* Success Banner */}
          {showSuccess && (
            <div className="success-banner">
              <div className="success-icon">✓</div>
              <div className="success-content">
                <h3>Appointment Booked Successfully!</h3>
                <p>We'll send you a confirmation email shortly</p>
              </div>
            </div>
          )}

          {/* Form Container */}
          <form onSubmit={handleAppointment} className="appointment-form">

            {/* STEP 1: Personal Information */}
            {currentStep === 1 && (
              <div className="form-step">
                <div className="step-header">
                  <FaUser className="step-icon" />
                  <div>
                    <h3>Personal Information</h3>
                    <p>Please provide your basic details</p>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={errors.firstName ? "error" : ""}
                    />
                    {errors.firstName && (
                      <span className="error-message">{errors.firstName}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={errors.lastName ? "error" : ""}
                    />
                    {errors.lastName && (
                      <span className="error-message">{errors.lastName}</span>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <FaEnvelope className="field-icon" />
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={errors.email ? "error" : ""}
                    />
                    {errors.email && (
                      <span className="error-message">{errors.email}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>
                      <FaPhone className="field-icon" />
                      Phone *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="98765 43210"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={errors.phone ? "error" : ""}
                    />
                    {errors.phone && (
                      <span className="error-message">{errors.phone}</span>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Date of Birth *</label>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleInputChange}
                      className={errors.dob ? "error" : ""}
                    />
                    {errors.dob && (
                      <span className="error-message">{errors.dob}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Gender *</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className={errors.gender ? "error" : ""}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.gender && (
                      <span className="error-message">{errors.gender}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Medical Details */}
            {currentStep === 2 && (
              <div className="form-step">
                <div className="step-header">
                  <FaStethoscope className="step-icon" />
                  <div>
                    <h3>Medical Details</h3>
                    <p>Select your preferred department and doctor</p>
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>National ID (NIC) *</label>
                  <input
                    type="text"
                    name="nic"
                    placeholder="12345-6789012-1"
                    value={formData.nic}
                    onChange={handleInputChange}
                    className={errors.nic ? "error" : ""}
                  />
                  {errors.nic && (
                    <span className="error-message">{errors.nic}</span>
                  )}
                </div>

                <div className="form-group full-width">
                  <label>
                    <FaMapMarkerAlt className="field-icon" />
                    Address *
                  </label>
                  <textarea
                    name="address"
                    placeholder="Enter your full address"
                    rows="2"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={errors.address ? "error" : ""}
                  ></textarea>
                  {errors.address && (
                    <span className="error-message">{errors.address}</span>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Medical Department *</label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleDepartmentChange}
                      className={errors.department ? "error" : ""}
                    >
                      {departmentsArray.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                    {errors.department && (
                      <span className="error-message">{errors.department}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Select Doctor *</label>
                    <select
                      name="doctor"
                      value={
                        formData.doctorFirstName
                          ? JSON.stringify({
                              firstName: formData.doctorFirstName,
                              lastName: formData.doctorLastName,
                            })
                          : ""
                      }
                      onChange={handleDoctorChange}
                      disabled={!formData.department || availableDoctors.length === 0}
                      className={errors.doctor ? "error" : ""}
                    >
                      <option value="">Select Doctor</option>
                      {availableDoctors.map((doctor) => (
                        <option
                          key={doctor._id}
                          value={JSON.stringify({
                            firstName: doctor.firstName,
                            lastName: doctor.lastName,
                          })}
                        >
                          Dr. {doctor.firstName} {doctor.lastName}
                        </option>
                      ))}
                    </select>
                    {errors.doctor && (
                      <span className="error-message">{errors.doctor}</span>
                    )}
                    {availableDoctors.length === 0 && formData.department && (
                      <span className="info-message">No doctors available for this department</span>
                    )}
                  </div>
                </div>

                <div className="form-group full-width">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="hasVisited"
                      checked={formData.hasVisited}
                      onChange={handleInputChange}
                    />
                    <span>I have visited this hospital before</span>
                  </label>
                </div>
              </div>
            )}

            {/* STEP 3: Schedule Appointment */}
            {currentStep === 3 && (
              <div className="form-step">
                <div className="step-header">
                  <FaCalendar className="step-icon" />
                  <div>
                    <h3>Schedule Your Appointment</h3>
                    <p>Choose your preferred date and time</p>
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Appointment Date *</label>
                  <input
                    type="date"
                    name="appointmentDate"
                    value={formData.appointmentDate}
                    onChange={handleInputChange}
                    className={errors.appointmentDate ? "error" : ""}
                  />
                  {errors.appointmentDate && (
                    <span className="error-message">{errors.appointmentDate}</span>
                  )}
                </div>

                <div className="form-group full-width">
                  <label>Appointment Time *</label>
                  <input
                    type="time"
                    name="appointmentTime"
                    value={formData.appointmentTime}
                    onChange={handleInputChange}
                    className={errors.appointmentTime ? "error" : ""}
                  />
                  {errors.appointmentTime && (
                    <span className="error-message">{errors.appointmentTime}</span>
                  )}
                  {errors.appointmentDateTime && (
                    <span className="error-message">{errors.appointmentDateTime}</span>
                  )}
                </div>

                {/* Summary */}
                {formData.firstName && formData.doctorFirstName && (
                  <div className="appointment-summary">
                    <h4>Appointment Summary</h4>
                    <div className="summary-row">
                      <span>Patient:</span>
                      <strong>{formData.firstName} {formData.lastName}</strong>
                    </div>
                    <div className="summary-row">
                      <span>Doctor:</span>
                      <strong>Dr. {formData.doctorFirstName} {formData.doctorLastName}</strong>
                    </div>
                    <div className="summary-row">
                      <span>Department:</span>
                      <strong>{formData.department}</strong>
                    </div>
                    {formData.appointmentDate && (
                      <div className="summary-row">
                        <span>Date & Time:</span>
                        <strong>
                          {new Date(`${formData.appointmentDate}`).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })} at {formData.appointmentTime}
                        </strong>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Form Actions */}
            <div className="form-actions">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="btn-secondary"
                >
                  ← Previous
                </button>
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="btn-primary"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className={`btn-primary btn-submit ${loading ? "loading" : ""}`}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Booking...
                    </>
                  ) : (
                    "Confirm & Book Appointment"
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AppointmentForm;
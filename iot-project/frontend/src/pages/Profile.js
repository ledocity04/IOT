import React from "react";
import { Container, Row, Col, Card, Image } from "react-bootstrap";
import { FaRegFilePdf, FaGithub, FaExternalLinkAlt } from "react-icons/fa";

const ProfilePage = () => {
  return (
    <Container className="mt-5 mb-4">
      <Row className="justify-content-center">
        <Col md={6}>
          <Card className="text-center">
            <Card.Body>
              <Image
                src="../assets/profile.png"
                roundedCircle
                style={{
                  width: "150px",
                  height: "150px",
                  objectFit: "cover",
                  marginBottom: "15px",
                }}
                alt="Profile Picture"
              />
              <Card.Title>Pham Thanh Nam</Card.Title>
              <Card.Text>
                Posts and Telecommunications Institute of Technology
              </Card.Text>
              <Card.Text>Ha Noi</Card.Text>
              <Card.Text>D22CN11 - B22DCCN563</Card.Text>
            </Card.Body>
          </Card>

          <Card className="mt-3">
            <Card.Body>
              <Card.Title>About This Project</Card.Title>
              <Card.Text>
                Build an IoT system to monitor and control environmental
                parameters such as temperature, humidity, and light. The system
                also allows for controlling devices such as fans, air
                conditioners, and lights through a user-friendly interface. Link
                to the document of the project: &nbsp;
                <a
                  // href="https://drive.google.com/file/d/143sZTtUgLB676G40vt9Uc8OSg75fzRr8/view?usp=sharing"
                  target="_blank"
                  rel="noreferrer"
                >
                  Drive
                </a>
              </Card.Text>
              <hr />
              <Row>
                <Col md={6}>
                  <h5 className="mb-3">Contact Information</h5>
                  <p className="mb-4">
                    <strong>Email:</strong> nemmphamit04@gmail.com
                  </p>
                  <p className="mb-4">
                    <strong>Phone:</strong> +0987582904
                  </p>
                  <p className="mb-4">
                    <strong>Location:</strong> Ha Noi, Viet Nam
                  </p>
                </Col>
                <Col md={6}>
                  <h5>Social Media & Resources:</h5>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <a
                      href="https://drive.google.com/file/d/1vHtDfB1LCDo8EIB1ybXfeGE687OyT6Jp/view?usp=drive_link"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-danger"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <FaRegFilePdf />
                      PDF Document
                    </a>

                    <a
                      href="https://github.com/ledocity04/IOT"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-dark"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <FaGithub />
                      GitHub
                    </a>

                    <a
                      href="http://localhost:8081/api-docs/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-success"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <FaExternalLinkAlt />
                      API Docs
                    </a>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProfilePage;

import React, { useState, useEffect, useCallback } from "react";
import {
  CircularProgress,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Chip,
  Grid,
  styled,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ConstructionIcon from "@mui/icons-material/Construction"; // Changed from EditIcon
import { toast } from "react-toastify";

// Styled components based on SprintsPage.jsx
const Root = styled(Box)({
  minHeight: "100vh",
  background: "white",
  padding: "24px",
});

const MainContainer = styled(Paper)({
  maxWidth: "1000px",
  margin: "0 auto",
  borderRadius: "24px",
  background: "linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)",
  boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
  overflow: "hidden",
});

const Header = styled(Box)({
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  padding: "48px 32px",
  textAlign: "center",
  color: "white",
});

const HeaderTitle = styled(Typography)({
  fontSize: "2.5rem",
  fontWeight: 700,
  marginBottom: "16px",
  textShadow: "0 2px 4px rgba(0,0,0,0.2)",
});

const HeaderSubtitle = styled(Typography)({
  fontSize: "1.2rem",
  opacity: 0.9,
});

const ContentContainer = styled(Box)({
  padding: "32px",
});

const ActionBar = styled(Box)({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "32px",
  gap: "16px",
});

const ResponseCard = styled(Paper)({
  margin: "16px 0",
  borderRadius: "16px",
  background: "linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)",
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  border: "1px solid rgba(102, 126, 234, 0.1)",
  transition: "all 0.3s ease",
  "&:hover": {
    boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
    transform: "translateY(-2px)",
  },
});

const getStatusColor = (status) => {
  switch (status) {
    case "chờ xử lý":
      return { backgroundColor: "#ffc107", color: "#000" };
    case "đang xử lý":
      return { backgroundColor: "#17a2b8", color: "#fff" };
    case "đã xử lý":
    case "Đã hoàn tất":
      return { backgroundColor: "#28a745", color: "#fff" };
    case "Đã huỷ":
      return { backgroundColor: "#dc3545", color: "#fff" };
    default:
      return { backgroundColor: "#6c757d", color: "#fff" };
  }
};

const SupportResponsePage = ({ authToken }) => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openHandleDialog, setOpenHandleDialog] = useState(false);
  const [responseToHandle, setResponseToHandle] = useState(null);
  const [handleData, setHandleData] = useState({
    status: "đang xử lý",
    responseMessage: "",
  });

  // Fetch all support responses (Admin/Leader)
  const fetchResponses = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/supports-response", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error("Không thể tải dữ liệu yêu cầu hỗ trợ.");
      const data = await res.json();

      // Enrich with user info
      const enriched = await Promise.all(
        data.map(async (resp) => {
          try {
            const userRes = await fetch(
              `http://localhost:3000/api/users/${resp.createdBy}`,
              { headers: { Authorization: `Bearer ${authToken}` } }
            );
            if (!userRes.ok)
              throw new Error("Không lấy được thông tin người dùng.");
            const { user } = await userRes.json();
            return { ...resp, userInfo: user };
          } catch {
            return { ...resp, userInfo: null };
          }
        })
      );

      setResponses(enriched);
    } catch (error) {
      toast.error(`Lỗi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authToken) fetchResponses();
  }, [authToken]);

  const handleSupportResponse = async () => {
    try {
      const res = await fetch(
        `http://localhost:3000/api/supports-response/${responseToHandle._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(handleData),
        }
      );
      if (!res.ok) throw new Error("Xử lý yêu cầu thất bại.");
      toast.success("Xử lý yêu cầu hỗ trợ thành công!");
      setOpenHandleDialog(false);
      setResponseToHandle(null);
      setHandleData({ status: "đang xử lý", responseMessage: "" });
      fetchResponses();
    } catch (error) {
      toast.error(`Lỗi: ${error.message}`);
    }
  };

  const openDialog = (resp) => {
    setResponseToHandle(resp);
    setHandleData({
      status: resp.status,
      responseMessage: resp.responseMessage || "",
    });
    setOpenHandleDialog(true);
  };

  return (
    <Root>
      <MainContainer>
        <Header>
          <HeaderTitle>Quản Lý Yêu Cầu Hỗ Trợ</HeaderTitle>
          <HeaderSubtitle>
            Xem và xử lý các yêu cầu hỗ trợ từ người dùng
          </HeaderSubtitle>
        </Header>

        <ContentContainer>
          <ActionBar>
            <Typography
              variant="h5"
              component="h2"
              fontWeight={600}
              color="primary"
            >
              Danh sách Yêu cầu
            </Typography>
          </ActionBar>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : responses.length ? (
            <List>
              {responses.map((resp) => (
                <ResponseCard key={resp._id}>
                  <ListItem
                    sx={{
                      flexDirection: "column",
                      alignItems: "flex-start",
                      padding: "16px 24px",
                    }}
                  >
                    <Typography variant="h6" fontWeight={600}>
                      {resp.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Mô tả: {resp.description}
                    </Typography>
                    {resp.responseMessage && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                      >
                        Phản hồi: {resp.responseMessage}
                      </Typography>
                    )}
                    <Grid
                      container
                      alignItems="center"
                      justifyContent="flex-end" // Aligned to the right
                      spacing={2}
                      sx={{ mt: 2, width: "auto" }}
                    >
                      <Grid item>
                        <Chip
                          label={resp.status.toUpperCase()}
                          sx={{
                            ...getStatusColor(resp.status),
                            fontWeight: 600,
                            padding: "4px 8px",
                            borderRadius: "8px",
                          }}
                        />
                      </Grid>
                      <Grid item>
                        <IconButton
                          onClick={() => openDialog(resp)}
                          sx={{ color: "#764ba2" }}
                        >
                          <ConstructionIcon /> {/* Changed to ConstructionIcon */}
                        </IconButton>
                      </Grid>
                    </Grid>
                  </ListItem>
                </ResponseCard>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: "center", p: 4, color: "text.secondary" }}>
              <Typography variant="h6">
                Hiện không có yêu cầu hỗ trợ nào.
              </Typography>
            </Box>
          )}
        </ContentContainer>
      </MainContainer>

      <Dialog
        open={openHandleDialog}
        onClose={() => setOpenHandleDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Xử Lý Yêu Cầu Hỗ Trợ</DialogTitle>
        <DialogContent dividers>
          <Box mb={2}>
            <Typography variant="h6">
              Tiêu đề: {responseToHandle?.title}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Mô tả: {responseToHandle?.description}
            </Typography>
          </Box>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Trạng thái</InputLabel>
            <Select
              value={handleData.status}
              label="Trạng thái"
              onChange={(e) =>
                setHandleData({ ...handleData, status: e.target.value })
              }
            >
              <MenuItem value="chờ xử lý">Chờ xử lý</MenuItem>
              <MenuItem value="đang xử lý">Đang xử lý</MenuItem>
              <MenuItem value="Đã hoàn tất">Đã hoàn tất</MenuItem>
              <MenuItem value="đã xử lý">Đã xử lý</MenuItem>
              <MenuItem value="Đã huỷ">Đã huỷ</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Phản hồi của bạn"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={handleData.responseMessage}
            onChange={(e) =>
              setHandleData({ ...handleData, responseMessage: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions sx={{ padding: "16px 24px" }}>
          <Button
            onClick={() => setOpenHandleDialog(false)}
            sx={{ fontWeight: 600 }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSupportResponse}
            color="primary"
            variant="contained"
            sx={{ fontWeight: 600 }}
            disabled={!handleData.responseMessage}
          >
            Gửi Phản Hồi
          </Button>
        </DialogActions>
      </Dialog>
    </Root>
  );
};

export default SupportResponsePage;

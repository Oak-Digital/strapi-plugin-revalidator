import React from "react";
import {
  HeaderLayout,
  ContentLayout,
  Box,
  Grid,
  GridItem,
  Select,
  Option,
  TextInput,
  Main,
  Button,
  Link,
  EmptyStateLayout,
  Loader,
} from "@strapi/design-system";
import { useIntl } from "react-intl";
import pluginId from "../../../pluginId";
import { request, useNotification } from "@strapi/helper-plugin";
import { Formik, Form } from "formik";
import { useHeadTypes } from "../../../lib/queries/head-type";
import { Check, ArrowLeft } from "@strapi/icons";
import { useRouteMatch, useHistory } from "react-router-dom";
import { useHead } from "../../../lib/queries/head";
import { CrossCircle } from "@strapi/icons";

type Inputs = {
  name: string;
  headType: string | null;
  fields?: Record<string, string>;
};

const EditHeadsPage = () => {
  const { push, replace } = useHistory();
  const notification = useNotification();
  const { formatMessage } = useIntl();
  const { data: headTypes } = useHeadTypes();
  const headTypesKeys = Object.keys(headTypes || {});

  const match = useRouteMatch<{ id: string }>(
    `/settings/${pluginId}/heads/edit/:id`
  );

  const idParam = match?.params.id ?? "new";
  const id = parseInt(idParam);
  const isNew = isNaN(id);

  const { data, error } = useHead(id, {
    enabled: !isNew,
  });

  if (!isNew && !data) {
    if (error) {
      return (
        <ContentLayout>
          <EmptyStateLayout
            icon={<CrossCircle />}
            content={formatMessage({
              id: `${pluginId}.settings.page.heads.create.error`,
              defaultMessage: "An error occurred while loading",
            })}
          />
        </ContentLayout>
      );
    }
    return (
      <ContentLayout>
        <EmptyStateLayout content={<Loader />} />
      </ContentLayout>
    );
  }

  const onSubmit = async (values: Inputs) => {
    let response;
    try {
      if (isNew) {
        response = await request(`/${pluginId}/heads`, {
          method: "POST",
          body: values,
        });
        replace(`/settings/${pluginId}/heads/edit/${response.id}`);
      } else {
        response = await request(`/${pluginId}/heads/${id}`, {
          method: "PUT",
          body: values,
        });
      }
    } catch (e) {
      console.error(e);
      notification({
        type: "warning",
        message: formatMessage({
          id: `${pluginId}.save-error`,
          defaultMessage: "An error occurred while saving",
        }),
      });
      return;
    }
    notification({
      type: "success",
      message: formatMessage({
        id: `${pluginId}.save-success`,
        defaultMessage: "Saved successfully",
      }),
    });
    push(`/settings/${pluginId}/heads`);
  };

  const initialFields = data?.fields || {};

  const initialValues: Inputs = {
    name: data?.name || "",
    headType: data?.headType || null,
    fields: initialFields,
  };

  return (
    <Main>
      <Formik initialValues={initialValues} onSubmit={onSubmit}>
        {({
          handleSubmit,
          values,
          handleChange,
          errors,
          touched,
          isSubmitting,
          setFieldValue,
        }) => (
          <Form onSubmit={handleSubmit}>
            <HeaderLayout
              title={formatMessage({
                id: `${pluginId}.settings.page.heads.create.title`,
                defaultMessage: "Create a new head",
              })}
              subtitle={formatMessage({
                id: `${pluginId}.settings.page.heads.create.description`,
                defaultMessage:
                  "Define endpoints and settings for the heads of this application",
              })}
              primaryAction={
                <Button
                  type="submit"
                  loading={isSubmitting}
                  startIcon={<Check />}
                >
                  {formatMessage({
                    id: "global.save",
                    defaultMessage: "Save",
                  })}
                </Button>
              }
              navigationAction={
                <Link
                  startIcon={<ArrowLeft />}
                  to={`/settings/${pluginId}/heads/`}
                >
                  {formatMessage({
                    id: "global.back",
                    defaultMessage: "Back",
                  })}
                </Link>
              }
            />
            <ContentLayout>
              <Box>
                <Grid gap={4}>
                  <GridItem col={6}>
                    <TextInput
                      name="name"
                      label={formatMessage({
                        id: `${pluginId}.settings.page.heads.create.name`,
                        defaultMessage: "Name",
                      })}
                      value={values.name}
                      onChange={(e: any) =>
                        setFieldValue("name", e.target.value)
                      }
                    />
                  </GridItem>
                  <GridItem col={6}>
                    <Select
                      required
                      error={errors.headType}
                      label="Type"
                      name="headType"
                      value={values.headType}
                      onChange={(value: string) =>
                        setFieldValue("headType", value)
                      }
                    >
                      {headTypesKeys.map((key) => (
                        <Option key={key} value={key}>
                          {key}
                        </Option>
                      ))}
                    </Select>
                  </GridItem>

                  {/* Fields */}
                  {values.headType &&
                    headTypes?.[values.headType].map((field) => (
                      <GridItem col={6} key={`${values.headType}.${field}`}>
                        <TextInput
                          name={field}
                          label={field}
                          value={values.fields?.[field] || ""}
                          onChange={(e: any) =>
                            setFieldValue(`fields.${field}`, e.target.value)
                          }
                        />
                      </GridItem>
                    ))}
                </Grid>
              </Box>
            </ContentLayout>
          </Form>
        )}
      </Formik>
    </Main>
  );
};

export default EditHeadsPage;
